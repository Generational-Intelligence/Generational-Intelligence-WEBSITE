import { and, count, eq, gte, lt } from "drizzle-orm";
import { db, enquiryRateEvents } from "@workspace/db";

export { clientAddressFrom, hashClientKey, trustedProxyHops } from "./clientKey";

/**
 * Enquiry abuse protection (Brief 001, Phase 2C).
 *
 * The store is the shared PostgreSQL database, so limits hold across every
 * autoscaled instance. Only a keyed hash of the client address is stored.
 */

export const ENQUIRY_LIMITS = {
  perClientShort: { max: 5, windowMs: 15 * 60 * 1000 },
  perClientDaily: { max: 20, windowMs: 24 * 60 * 60 * 1000 },
  /** Site-wide ceiling: bounds the damage if client identification is ever wrong. */
  siteDaily: { max: 300, windowMs: 24 * 60 * 60 * 1000 },
} as const;

const RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; reason: "client" | "site" };

export async function checkEnquiryRateLimit(
  clientKey: string,
  now = new Date(),
): Promise<RateLimitDecision> {
  const since = (ms: number) => new Date(now.getTime() - ms);
  const { perClientShort, perClientDaily, siteDaily } = ENQUIRY_LIMITS;

  const [[shortRow], [dailyRow], [siteRow]] = await Promise.all([
    db
      .select({ value: count() })
      .from(enquiryRateEvents)
      .where(
        and(
          eq(enquiryRateEvents.clientKey, clientKey),
          gte(enquiryRateEvents.createdAt, since(perClientShort.windowMs)),
        ),
      ),
    db
      .select({ value: count() })
      .from(enquiryRateEvents)
      .where(
        and(
          eq(enquiryRateEvents.clientKey, clientKey),
          gte(enquiryRateEvents.createdAt, since(perClientDaily.windowMs)),
        ),
      ),
    db
      .select({ value: count() })
      .from(enquiryRateEvents)
      .where(gte(enquiryRateEvents.createdAt, since(siteDaily.windowMs))),
  ]);

  if (Number(shortRow?.value ?? 0) >= perClientShort.max) {
    return { allowed: false, retryAfterSeconds: perClientShort.windowMs / 1000, reason: "client" };
  }
  if (Number(dailyRow?.value ?? 0) >= perClientDaily.max) {
    return { allowed: false, retryAfterSeconds: perClientDaily.windowMs / 1000, reason: "client" };
  }
  if (Number(siteRow?.value ?? 0) >= siteDaily.max) {
    return { allowed: false, retryAfterSeconds: 60 * 60, reason: "site" };
  }
  return { allowed: true };
}

export async function recordEnquiryAttempt(clientKey: string, now = new Date()): Promise<void> {
  await db.insert(enquiryRateEvents).values({ clientKey, createdAt: now });
  await db
    .delete(enquiryRateEvents)
    .where(lt(enquiryRateEvents.createdAt, new Date(now.getTime() - RETENTION_MS)));
}
