import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ENQUIRY_EMAIL_SUBJECT,
  buildEnquiryEmail,
  parseEnquiry,
  type Enquiry,
} from "../lib/enquiry";

const valid = {
  name: "Siobhán Ní Bhriain",
  email: "siobhan@example.ie",
  company: "Ó Briain & Sons, Ltd.",
  message: "Hello,\nWe would like to discuss a project.\nThanks!",
};

function decodeRaw(raw: string) {
  const message = Buffer.from(raw, "base64url").toString("utf8");
  const [head, ...rest] = message.split("\r\n\r\n");
  const headers = head!.split("\r\n");
  const body = Buffer.from(rest.join("\r\n\r\n").replace(/\r\n/g, ""), "base64").toString("utf8");
  return { headers, body };
}

test("accepts a valid enquiry with international characters and punctuation", () => {
  const result = parseEnquiry(valid);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.name, valid.name);
});

for (const name of ["José O'Neill-Smith", "李小龍", "Zoë Saldaña", "Nguyễn Văn A", "Al-Hassan, Jr."]) {
  test(`accepts legitimate name: ${name}`, () => {
    assert.equal(parseEnquiry({ ...valid, name }).ok, true);
  });
}

test("trims surrounding whitespace", () => {
  const result = parseEnquiry({ ...valid, name: "  Ann  ", email: " a@example.com ", company: "  " });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.name, "Ann");
    assert.equal(result.value.email, "a@example.com");
    assert.equal(result.value.company, null);
  }
});

const headerInjectionNames = [
  "Bob\r\nBcc: victim@example.com",
  "Bob\nBcc: victim@example.com",
  "Bob\rTo: victim@example.com",
  "Bob\u0000",
  "Bob\u0085Bcc: victim@example.com",
  "Bob\u2028Bcc: victim@example.com",
  "Bob \u202Eevil",
];
for (const name of headerInjectionNames) {
  test(`rejects control or deceptive characters in name: ${JSON.stringify(name)}`, () => {
    assert.equal(parseEnquiry({ ...valid, name }).ok, false);
  });
}

test("rejects control characters in company", () => {
  assert.equal(parseEnquiry({ ...valid, company: "Acme\r\nBcc: x@example.com" }).ok, false);
});

for (const email of [
  "a@example.com\r\nBcc: victim@example.com",
  "a@example.com, victim@example.com",
  "a@example.com;victim@example.com",
  "Name <a@example.com>",
  "not-an-email",
  `${"a".repeat(250)}@example.com`,
]) {
  test(`rejects unsafe or invalid email: ${JSON.stringify(email).slice(0, 60)}`, () => {
    assert.equal(parseEnquiry({ ...valid, email }).ok, false);
  });
}

test("enforces length limits", () => {
  assert.equal(parseEnquiry({ ...valid, name: "A" }).ok, false);
  assert.equal(parseEnquiry({ ...valid, name: "A".repeat(120) }).ok, true);
  assert.equal(parseEnquiry({ ...valid, name: "A".repeat(121) }).ok, false);
  assert.equal(parseEnquiry({ ...valid, company: "C".repeat(160) }).ok, true);
  assert.equal(parseEnquiry({ ...valid, company: "C".repeat(161) }).ok, false);
  assert.equal(parseEnquiry({ ...valid, message: "Too short" }).ok, false);
  assert.equal(parseEnquiry({ ...valid, message: "M".repeat(5000) }).ok, true);
  assert.equal(parseEnquiry({ ...valid, message: "M".repeat(5001) }).ok, false);
});

test("message allows line breaks and tabs but rejects other control characters", () => {
  assert.equal(parseEnquiry({ ...valid, message: "Line one\r\nLine two\twith tab" }).ok, true);
  assert.equal(parseEnquiry({ ...valid, message: "Hidden \u0007 bell character" }).ok, false);
});

test("rejects non-object and wrongly typed bodies", () => {
  for (const body of [null, undefined, "text", 42, [], { ...valid, name: 123 }, { ...valid, message: undefined }]) {
    assert.equal(parseEnquiry(body).ok, false);
  }
});

test("email uses a fixed header set and fixed subject", () => {
  const enquiry: Enquiry = { name: valid.name, email: valid.email, company: null, message: valid.message };
  const { headers, body } = decodeRaw(buildEnquiryEmail("owner@example.com", enquiry));
  assert.deepEqual(
    headers.map((h) => h.split(":")[0]),
    ["To", "Reply-To", "Subject", "MIME-Version", "Content-Type", "Content-Transfer-Encoding"],
  );
  assert.ok(headers.includes(`Subject: ${ENQUIRY_EMAIL_SUBJECT}`));
  assert.ok(headers.includes("To: owner@example.com"));
  assert.ok(headers.includes(`Reply-To: ${valid.email}`));
  assert.ok(body.includes(`Name: ${valid.name}`));
  assert.ok(body.includes("Company: Not provided"));
  assert.ok(body.includes("We would like to discuss a project."));
});

test("visitor text that looks like headers stays inside the encoded body", () => {
  const enquiry: Enquiry = {
    name: "Mallory",
    email: "m@example.com",
    company: "Bcc: victim@example.com",
    message: "Line\r\nBcc: victim@example.com\r\n\r\nSubject: spoof",
  };
  const raw = Buffer.from(buildEnquiryEmail("owner@example.com", enquiry), "base64url").toString("utf8");
  const head = raw.split("\r\n\r\n")[0]!;
  assert.ok(!/bcc/i.test(head));
  assert.equal((head.match(/^Subject:/gim) ?? []).length, 1);
});

test("refuses to build an email from an unsafe address even if validation is bypassed", () => {
  const enquiry: Enquiry = { name: "X", email: "a@example.com\r\nBcc: v@example.com", company: null, message: "m".repeat(10) };
  assert.throws(() => buildEnquiryEmail("owner@example.com", enquiry));
  assert.throws(() => buildEnquiryEmail("owner@example.com\r\nBcc: v@example.com", { ...enquiry, email: "a@example.com" }));
});
