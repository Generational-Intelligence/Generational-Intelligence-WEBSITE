import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { count } from "drizzle-orm";

/**
 * Integration tests for POST /api/queries.
 * Requires DATABASE_URL pointing at a disposable test database.
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

const { default: app } = await import("../app");
const { db, pool, querySubmissions } = await import("@workspace/db");
const { mailer } = await import("../lib/mailer");

let server: Server;
let baseUrl: string;
const sent: string[] = [];
let failDelivery = false;

before(async () => {
  mailer.send = async (raw: string) => {
    if (failDelivery) throw new Error("Simulated delivery failure");
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
  await db.delete(querySubmissions);
});

async function submissionCount() {
  const [row] = await db.select({ value: count() }).from(querySubmissions);
  return Number(row?.value ?? 0);
}

function post(body: unknown) {
  return fetch(`${baseUrl}/api/queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = {
  name: "Test Visitor",
  email: "visitor@example.com",
  company: "",
  message: "This is a legitimate test enquiry.",
};

test("valid enquiry is stored once and notified once", async () => {
  const response = await post(valid);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { accepted: true });
  assert.equal(await submissionCount(), 1);
  assert.equal(sent.length, 1);
  const message = Buffer.from(sent[0]!, "base64url").toString("utf8");
  assert.match(message, /^Subject: New Generational Intelligence website enquiry$/m);
});

test("header-injection attempt is rejected before storage or email", async () => {
  const response = await post({ ...valid, name: "Spammer\r\nBcc: victim@example.com" });
  assert.equal(response.status, 400);
  assert.equal(await submissionCount(), 0);
  assert.equal(sent.length, 0);
});

test("oversized message is rejected", async () => {
  const response = await post({ ...valid, message: "x".repeat(5001) });
  assert.equal(response.status, 400);
  assert.equal(await submissionCount(), 0);
  assert.equal(sent.length, 0);
});

test("delivery failure returns an error and does not report success", async () => {
  failDelivery = true;
  const response = await post(valid);
  assert.equal(response.status, 502);
  assert.equal(sent.length, 0);
});
