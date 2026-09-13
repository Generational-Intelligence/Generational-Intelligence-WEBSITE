import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
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

export const querySubmissions = pgTable("gi_query_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});