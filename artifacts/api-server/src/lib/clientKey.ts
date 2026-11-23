import { createHmac } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";

/**
 * Number of trusted proxies that append to X-Forwarded-For in front of the
 * app. Browsers can put anything at the start of that header, but each
 * trusted proxy appends the address it actually saw. The client address is
 * therefore read counting from the right, never from the left.
 *
 * Replit autoscale sits behind Google load balancing. Confirm the value after
 * deployment (see docs/brief-001/verification.md) and set TRUSTED_PROXY_HOPS
 * if it differs. Choosing too high a number fails safe (falls back to the
 * leftmost entry); too low a number would group all visitors together, which
 * the site-wide ceiling and monitoring make visible.
 */
export function trustedProxyHops(): number {
  const configured = Number(process.env.TRUSTED_PROXY_HOPS);
  return Number.isInteger(configured) && configured >= 1 && configured <= 5 ? configured : 2;
}

export function clientAddressFrom(
  headers: IncomingHttpHeaders,
  socketAddress: string | undefined,
  hops = trustedProxyHops(),
): string {
  const header = headers["x-forwarded-for"];
  const raw = Array.isArray(header) ? header.join(",") : header ?? "";
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.length <= 64);
  if (entries.length === 0) return socketAddress ?? "unknown";
  const index = Math.max(0, entries.length - hops);
  return entries[index]!;
}

export function hashClientKey(address: string): string {
  const secret = process.env.SESSION_SECRET || "gi-enquiry-rate-limit";
  return createHmac("sha256", secret).update(`enquiry:${address}`).digest("hex").slice(0, 32);
}
