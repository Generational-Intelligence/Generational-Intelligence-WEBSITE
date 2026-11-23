import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const studioOwners = pgTable("gi_studio_owners", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("gi_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Software"),
  publicStatus: text("public_status").notNull().default("In development"),
  status: text("status").notNull().default("Draft"),
  visibility: text("visibility").notNull().default("private"),
  displayOrder: integer("display_order").notNull().default(0),
  logoPath: text("logo_path"),
  imagePath: text("image_path"),
  privateNotes: text("private_notes").notNull().default(""),
  privateFiles: jsonb("private_files").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const publishedSnapshots = pgTable("gi_published_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Website enquiries.
 *
 * Delivery is tracked separately from storage (Brief 001, Phase 2):
 * delivery_status is "pending" | "sending" | "sent" | "failed" for new rows.
 * Rows that existed before delivery tracking keep the default "legacy" and are
 * never automatically re-sent.
 */
export const querySubmissions = pgTable(
  "gi_query_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    idempotencyKey: text("idempotency_key"),
    deliveryStatus: text("delivery_status").notNull().default("legacy"),
    deliveryAttempts: integer("delivery_attempts").notNull().default(0),
    lastDeliveryAttemptAt: timestamp("last_delivery_attempt_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    deliveryError: text("delivery_error"),
  },
  (table) => [
    uniqueIndex("gi_query_submissions_idempotency_key_idx").on(table.idempotencyKey),
    index("gi_query_submissions_delivery_status_idx").on(table.deliveryStatus),
  ],
);

/**
 * Abuse-protection counters for the public enquiry form. Shared across all
 * autoscaled instances. Stores only a keyed hash of the client address, never
 * the address itself. Rows older than two days are deleted automatically.
 */
export const enquiryRateEvents = pgTable(
  "gi_enquiry_rate_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientKey: text("client_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("gi_enquiry_rate_events_client_created_idx").on(table.clientKey, table.createdAt),
    index("gi_enquiry_rate_events_created_idx").on(table.createdAt),
  ],
);