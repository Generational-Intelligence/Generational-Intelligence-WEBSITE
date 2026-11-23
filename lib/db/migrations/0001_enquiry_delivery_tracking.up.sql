-- Brief 001, Phase 2: enquiry delivery tracking, idempotency and rate limiting.
-- Additive only. Safe to run more than once. Existing enquiries are preserved
-- and marked "legacy" so they are never automatically re-sent.
BEGIN;

ALTER TABLE gi_query_submissions
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS delivery_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivery_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS delivery_error text;

CREATE UNIQUE INDEX IF NOT EXISTS gi_query_submissions_idempotency_key_idx
  ON gi_query_submissions USING btree (idempotency_key);
CREATE INDEX IF NOT EXISTS gi_query_submissions_delivery_status_idx
  ON gi_query_submissions USING btree (delivery_status);

CREATE TABLE IF NOT EXISTS gi_enquiry_rate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  client_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS gi_enquiry_rate_events_client_created_idx
  ON gi_enquiry_rate_events USING btree (client_key, created_at);
CREATE INDEX IF NOT EXISTS gi_enquiry_rate_events_created_idx
  ON gi_enquiry_rate_events USING btree (created_at);

COMMIT;
