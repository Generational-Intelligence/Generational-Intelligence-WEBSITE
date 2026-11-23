import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";

/**
 * Integration tests for POST /api/queries (Brief 001, Phase 2).
 * Requires TEST_DATABASE_URL pointing at a disposable test database.
 * Email delivery is replaced with an in-memory stub: no real email is sent.
 */

// Safety: these tests delete rows. They must never run against the
// development or production database, so they only use TEST_DATABASE_URL.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("Set TEST_DATABASE_URL to a disposable test database to run integration tests");
}
if (testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must not be the same database as DATABASE_URL");
}
if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run integration tests with NODE_ENV=production");
}
process.env.DATABASE_URL = testDatabaseUrl;
process.env.QUERY_DESTINATION_EMAIL = "owner@example.com";
process.env.TRUSTED_PROXY_HOPS = "2";

const { default: app } = await import("../app");
const { db, pool, querySubmissions, enquiryRateEvents } = await import("@workspace/db");
const { mailer } = await import("../lib/mailer");
const { retryPendingDeliveries } = await import("../lib/enquiryDelivery");

let server: Server;
let baseUrl: string;
const sent: string[] = [];
let failDelivery = false;
let deliveryDelayMs = 0;

before(async () => {
  mailer.send = async (raw: string) => {
    if (deliveryDelayMs) await new Promise((r) => setTimeout(r, deliveryDelayMs));
    if (failDelivery) throw new Error("Gmail delivery failed with status 503");
    sent.push(raw);
  };
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

beforeEach(async () => {
  sent.length = 0;
  failDelivery = false;
  deliveryDelayMs = 0;
  await db.delete(querySubmissions);
  await db.delete(enquiryRateEvents);
});

async function rows() {
  return db.select().from(querySubmissions);
}

let clientCounter = 0;
/** Each test uses its own simulated visitor address unless one is given. */
function newClient() {
  clientCounter += 1;
  return `198.51.100.${clientCounter}`;
}

function post(body: unknown, client = newClient(), spoofed = "") {
  const forwarded = [spoofed, client, "34.111.179.208"].filter(Boolean).join(", ");
  return fetch(`${baseUrl}/api/queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": forwarded },
    body: JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test Visitor",
    email: "visitor@example.com",
    company: "",
    message: "This is a legitimate test enquiry.",
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

test("valid enquiry is stored once and notified once", async () => {
  const response = await post(validBody());
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { accepted: true });
  const stored = await rows();
  assert.equal(stored.length, 1);
  assert.equal(stored[0]!.deliveryStatus, "sent");
  assert.equal(stored[0]!.deliveryAttempts, 1);
  assert.ok(stored[0]!.deliveredAt);
  assert.equal(sent.length, 1);
  assert.match(Buffer.from(sent[0]!, "base64url").toString("utf8"), /^Subject: New Generational Intelligence website enquiry$/m);
});

test("header-injection attempt is rejected before storage or email", async () => {
  const response = await post(validBody({ name: "Spammer\r\nBcc: victim@example.com" }));
  assert.equal(response.status, 400);
  assert.equal((await rows()).length, 0);
  assert.equal(sent.length, 0);
});

test("retrying with the same key does not create a duplicate or a second email", async () => {
  const client = newClient();
  const body = validBody();
  assert.equal((await post(body, client)).status, 201);
  assert.equal((await post(body, client)).status, 201);
  assert.equal((await rows()).length, 1);
  assert.equal(sent.length, 1);
});

test("simultaneous double-submit stores and notifies once", async () => {
  deliveryDelayMs = 50;
  const client = newClient();
  const body = validBody();
  const responses = await Promise.all([post(body, client), post(body, client), post(body, client)]);
  for (const response of responses) assert.equal(response.status, 201);
  assert.equal((await rows()).length, 1);
  assert.equal(sent.length, 1);
});

test("saved enquiry with failed email is recorded as failed and recovered on retry without duplication", async () => {
  const client = newClient();
  const body = validBody();
  failDelivery = true;
  const first = await post(body, client);
  assert.equal(first.status, 201, "visitor is told the enquiry was received because it is stored");
  let stored = await rows();
  assert.equal(stored.length, 1);
  assert.equal(stored[0]!.deliveryStatus, "failed");
  assert.equal(stored[0]!.deliveryError, "gmail_http_503");
  assert.equal(sent.length, 0);

  failDelivery = false;
  assert.equal((await post(body, client)).status, 201);
  stored = await rows();
  assert.equal(stored.length, 1);
  assert.equal(stored[0]!.deliveryStatus, "sent");
  assert.equal(stored[0]!.deliveryAttempts, 2);
  assert.equal(sent.length, 1);
});

test("failed deliveries are retried automatically after the back-off, and only once each", async () => {
  failDelivery = true;
  await post(validBody());
  failDelivery = false;
  assert.equal(await retryPendingDeliveries("owner@example.com"), 0, "not retried before back-off");
  const later = new Date(Date.now() + 11 * 60 * 1000);
  assert.equal(await retryPendingDeliveries("owner@example.com", 2, later), 1);
  assert.equal(await retryPendingDeliveries("owner@example.com", 2, later), 0);
  assert.equal(sent.length, 1);
  assert.equal((await rows())[0]!.deliveryStatus, "sent");
});

test("delivery gives up after the maximum number of attempts", async () => {
  failDelivery = true;
  await post(validBody());
  let when = Date.now();
  for (let i = 0; i < 8; i += 1) {
    when += 11 * 60 * 1000;
    await retryPendingDeliveries("owner@example.com", 2, new Date(when));
  }
  const [row] = await rows();
  assert.equal(row!.deliveryStatus, "failed");
  assert.equal(row!.deliveryAttempts, 5);
});

test("enquiries stored before the upgrade are never automatically re-sent", async () => {
  await db.insert(querySubmissions).values({
    name: "Legacy",
    email: "legacy@example.com",
    message: "Received before delivery tracking existed.",
  });
  const later = new Date(Date.now() + 60 * 60 * 1000);
  assert.equal(await retryPendingDeliveries("owner@example.com", 5, later), 0);
  assert.equal(sent.length, 0);
});

test("anti-spam field: bots get a normal response but nothing is stored or sent", async () => {
  const response = await post(validBody({ website: "http://spam.example" }));
  assert.equal(response.status, 201);
  assert.equal((await rows()).length, 0);
  assert.equal(sent.length, 0);
});

test("sixth submission within 15 minutes is rate-limited", async () => {
  const client = newClient();
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await post(validBody(), client)).status, 201, `submission ${i + 1}`);
  }
  const blocked = await post(validBody(), client);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "900");
  assert.equal((await rows()).length, 5);
  assert.equal(sent.length, 5);
});

test("faking X-Forwarded-For does not bypass the limit", async () => {
  const client = newClient();
  for (let i = 0; i < 5; i += 1) await post(validBody(), client, `10.0.0.${i}`);
  const blocked = await post(validBody(), client, "192.0.2.250");
  assert.equal(blocked.status, 429);
});

test("one visitor being limited does not affect another", async () => {
  const noisy = newClient();
  for (let i = 0; i < 6; i += 1) await post(validBody(), noisy);
  assert.equal((await post(validBody(), newClient())).status, 201);
});

test("daily limit of 20 per visitor applies across 15-minute windows", async () => {
  const client = newClient();
  const { hashClientKey } = await import("../lib/rateLimit");
  const key = hashClientKey(client);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  await db.insert(enquiryRateEvents).values(
    Array.from({ length: 20 }, () => ({ clientKey: key, createdAt: twoHoursAgo })),
  );
  const blocked = await post(validBody(), client);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "86400");
});

test("malformed submissions are rejected and do not use up the visitor's allowance", async () => {
  const client = newClient();
  for (let i = 0; i < 8; i += 1) {
    assert.equal((await post({ name: "x" }, client)).status, 400);
  }
  assert.equal((await post(validBody(), client)).status, 201);
});

test("stored delivery errors contain no personal data", async () => {
  failDelivery = true;
  await post(validBody({ name: "Private Person", email: "private@example.com" }));
  const [row] = await rows();
  assert.ok(row!.deliveryError);
  assert.ok(!row!.deliveryError!.includes("private"));
});
