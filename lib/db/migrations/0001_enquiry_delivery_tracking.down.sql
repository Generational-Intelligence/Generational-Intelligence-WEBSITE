-- Rollback for 0001_enquiry_delivery_tracking.
-- Removes only the delivery-tracking columns and the rate-limit table.
-- Every enquiry row (name, email, company, message, created_at) is kept.
-- Delivery history for enquiries received after the upgrade is lost, so
-- export it first if it is needed:
--   SELECT id, created_at, delivery_status, delivery_attempts, delivered_at, delivery_error
--   FROM gi_query_submissions WHERE delivery_status <> 'legacy';
-- Deploy the previous application version BEFORE running this rollback.
BEGIN;

DROP TABLE IF EXISTS gi_enquiry_rate_events;

DROP INDEX IF EXISTS gi_query_submissions_delivery_status_idx;
DROP INDEX IF EXISTS gi_query_submissions_idempotency_key_idx;

ALTER TABLE gi_query_submissions
  DROP COLUMN IF EXISTS delivery_error,
  DROP COLUMN IF EXISTS delivered_at,
  DROP COLUMN IF EXISTS last_delivery_attempt_at,
  DROP COLUMN IF EXISTS delivery_attempts,
  DROP COLUMN IF EXISTS delivery_status,
  DROP COLUMN IF EXISTS idempotency_key;

COMMIT;
