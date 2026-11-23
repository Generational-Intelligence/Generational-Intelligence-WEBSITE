import { and, asc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { db, querySubmissions } from "@workspace/db";
import { buildEnquiryEmail, type Enquiry } from "./enquiry";
import { mailer } from "./mailer";

/**
 * Stores enquiries exactly once and tracks notification delivery separately
 * (Brief 001, Phase 2D).
 *
 * Status flow for new rows: pending -> sending -> sent | failed.
 * A failed row is retried automatically (bounded) and never duplicated.
 */

export const MAX_DELIVERY_ATTEMPTS = 5;
/** A "sending" claim older than this is treated as abandoned (for example an instance stopped mid-send). */
const STALE_SENDING_MS = 2 * 60 * 1000;
/** Minimum wait before automatically retrying a failed delivery. */
const RETRY_BACKOFF_MS = 10 * 60 * 1000;

export type StoreResult = { id: string; created: boolean; deliveryStatus: string };

export async function storeEnquiry(
  enquiry: Enquiry,
  idempotencyKey: string | null,
): Promise<StoreResult> {
  const [inserted] = await db
    .insert(querySubmissions)
    .values({
      ...enquiry,
      idempotencyKey,
      deliveryStatus: "pending",
    })
    .onConflictDoNothing({ target: querySubmissions.idempotencyKey })
    .returning({ id: querySubmissions.id, deliveryStatus: querySubmissions.deliveryStatus });

  if (inserted) return { ...inserted, created: true };

  // Same idempotency key already stored: this is a retry of the same form fill.
  const [existing] = await db
    .select({ id: querySubmissions.id, deliveryStatus: querySubmissions.deliveryStatus })
    .from(querySubmissions)
    .where(eq(querySubmissions.idempotencyKey, idempotencyKey!));
  if (!existing) throw new Error("Enquiry conflict without an existing row");
  return { ...existing, created: false };
}

/**
 * Atomically claims a row for sending so two instances never email the same
 * enquiry at once, then sends and records the outcome.
 * Returns the final status, or null if another worker holds the claim or the
 * row is not eligible.
 */
export async function deliverEnquiry(
  id: string,
  destination: string,
  now = new Date(),
): Promise<"sent" | "failed" | null> {
  const staleBefore = new Date(now.getTime() - STALE_SENDING_MS);
  const [claimed] = await db
    .update(querySubmissions)
    .set({
      deliveryStatus: "sending",
      deliveryAttempts: sql`${querySubmissions.deliveryAttempts} + 1`,
      lastDeliveryAttemptAt: now,
    })
    .where(
      and(
        eq(querySubmissions.id, id),
        lt(querySubmissions.deliveryAttempts, MAX_DELIVERY_ATTEMPTS),
        or(
          inArray(querySubmissions.deliveryStatus, ["pending", "failed"]),
          and(
            eq(querySubmissions.deliveryStatus, "sending"),
            lt(querySubmissions.lastDeliveryAttemptAt, staleBefore),
          ),
        ),
      ),
    )
    .returning();

  if (!claimed) return null;

  try {
    await mailer.send(
      buildEnquiryEmail(destination, {
        name: claimed.name,
        email: claimed.email,
        company: claimed.company,
        message: claimed.message,
      }),
    );
    await db
      .update(querySubmissions)
      .set({ deliveryStatus: "sent", deliveredAt: new Date(), deliveryError: null })
      .where(eq(querySubmissions.id, id));
    return "sent";
  } catch (error) {
    await db
      .update(querySubmissions)
      .set({ deliveryStatus: "failed", deliveryError: classifyDeliveryError(error) })
      .where(eq(querySubmissions.id, id));
    return "failed";
  }
}

/** Short, content-free error code: never store message text or addresses. */
function classifyDeliveryError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const status = /status (\d{3})/.exec(message)?.[1];
  if (status) return `gmail_http_${status}`;
  if (/unsafe/i.test(message)) return "unsafe_header_refused";
  return "delivery_error";
}

/**
 * Retries a small number of failed or abandoned deliveries. Called during
 * normal enquiry traffic so recovery needs no separate scheduler.
 */
export async function retryPendingDeliveries(
  destination: string,
  limit = 2,
  now = new Date(),
): Promise<number> {
  const retryBefore = new Date(now.getTime() - RETRY_BACKOFF_MS);
  const staleBefore = new Date(now.getTime() - STALE_SENDING_MS);
  const candidates = await db
    .select({ id: querySubmissions.id })
    .from(querySubmissions)
    .where(
      and(
        lt(querySubmissions.deliveryAttempts, MAX_DELIVERY_ATTEMPTS),
        or(
          and(
            eq(querySubmissions.deliveryStatus, "failed"),
            lt(querySubmissions.lastDeliveryAttemptAt, retryBefore),
          ),
          and(
            eq(querySubmissions.deliveryStatus, "sending"),
            lt(querySubmissions.lastDeliveryAttemptAt, staleBefore),
          ),
        ),
      ),
    )
    .orderBy(asc(querySubmissions.createdAt))
    .limit(limit);

  let sent = 0;
  for (const candidate of candidates) {
    if ((await deliverEnquiry(candidate.id, destination, now)) === "sent") sent += 1;
  }
  return sent;
}
