import { SubmitQueryBody } from "@workspace/api-zod";

/**
 * Public website enquiry handling.
 *
 * Security rules (Brief 001, Phase 2):
 * - Validation always happens on the server; browser validation is a convenience only.
 * - Nothing a visitor types is ever placed in an email header except the
 *   Reply-To address, and only after strict validation.
 * - The subject line is fixed.
 */

export const ENQUIRY_EMAIL_SUBJECT = "New Generational Intelligence website enquiry";

/** C0 controls, DEL and C1 controls. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/u;

/** Line/paragraph separators and bidirectional overrides that can disguise text. */
const DECEPTIVE_FORMATTING = /[\u2028\u2029\u202A-\u202E\u2066-\u2069]/u;

/** Message text may contain tabs and line breaks, but no other control characters. */
const MESSAGE_FORBIDDEN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/u;

/** Characters that must never appear in an address used in a header. */
const ADDRESS_FORBIDDEN = /[\s,;:<>"()[\]\\]/u;

export interface Enquiry {
  name: string;
  email: string;
  company: string | null;
  message: string;
}

export type EnquiryParseResult =
  | {
      ok: true;
      value: Enquiry;
      /** Client-generated key so a retried submission is never stored twice. */
      idempotencyKey: string | null;
      /** True when the hidden anti-spam field was filled in (almost always a bot). */
      honeypotTriggered: boolean;
    }
  | { ok: false };

function trimIfString(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function isSingleLineSafe(value: string): boolean {
  return !CONTROL_CHARS.test(value) && !DECEPTIVE_FORMATTING.test(value);
}

/**
 * Normalises and validates an enquiry body. Rejects anything malformed or
 * unsafe; never attempts to "clean" a dangerous value into an acceptable one.
 */
export function parseEnquiry(body: unknown): EnquiryParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false };
  }
  const input = body as Record<string, unknown>;

  const company = trimIfString(input["company"]);
  const message =
    typeof input["message"] === "string"
      ? input["message"].replace(/\r\n?/g, "\n").trim()
      : input["message"];

  const parsed = SubmitQueryBody.safeParse({
    name: trimIfString(input["name"]),
    email: trimIfString(input["email"]),
    company: company === "" || company === null ? undefined : company,
    message,
    idempotencyKey:
      input["idempotencyKey"] === "" || input["idempotencyKey"] === null
        ? undefined
        : input["idempotencyKey"],
    website: typeof input["website"] === "string" ? input["website"] : undefined,
  });
  if (!parsed.success) return { ok: false };

  const value: Enquiry = {
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company ?? null,
    message: parsed.data.message,
  };

  if (!isSingleLineSafe(value.name)) return { ok: false };
  if (value.company !== null && !isSingleLineSafe(value.company)) return { ok: false };
  if (!isSingleLineSafe(value.email) || ADDRESS_FORBIDDEN.test(value.email)) {
    return { ok: false };
  }
  if (MESSAGE_FORBIDDEN.test(value.message)) return { ok: false };

  return {
    ok: true,
    value,
    idempotencyKey: parsed.data.idempotencyKey?.toLowerCase() ?? null,
    honeypotTriggered: (parsed.data.website ?? "").trim() !== "",
  };
}

function assertHeaderSafe(value: string): string {
  if (!value || CONTROL_CHARS.test(value) || DECEPTIVE_FORMATTING.test(value)) {
    throw new Error("Refusing to build an email header from an unsafe value");
  }
  return value;
}

/**
 * Builds a Gmail API "raw" message (base64url RFC 5322).
 *
 * Headers are a fixed set. Visitor text only appears in the base64-encoded
 * body, so it cannot create or alter headers.
 */
export function buildEnquiryEmail(destination: string, enquiry: Enquiry): string {
  const replyTo = assertHeaderSafe(enquiry.email);
  if (ADDRESS_FORBIDDEN.test(replyTo)) {
    throw new Error("Refusing to use an unsafe Reply-To address");
  }

  const bodyText = [
    "A new enquiry was submitted through the Generational Intelligence website.",
    "",
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Company: ${enquiry.company ?? "Not provided"}`,
    "",
    "Message:",
    enquiry.message,
    "",
  ]
    .join("\n")
    .replace(/\n/g, "\r\n");

  const encodedBody = (
    Buffer.from(bodyText, "utf8").toString("base64").match(/.{1,76}/g) ?? []
  ).join("\r\n");

  const headers = [
    `To: ${assertHeaderSafe(destination)}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${ENQUIRY_EMAIL_SUBJECT}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];

  return Buffer.from([...headers, "", encodedBody, ""].join("\r\n"), "utf8").toString(
    "base64url",
  );
}
