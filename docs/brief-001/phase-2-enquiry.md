# Brief 001 — Phase 2: Contact form security

## Behaviour

| Situation | Visitor sees | Stored | Email |
|---|---|---|---|
| Valid enquiry | "Query Received" | Once | Once |
| Same form submitted twice (double click, retry, network repeat) | "Query Received" | Once | Once |
| Saved, but Gmail fails | "Query Received" | Once, status `failed` | Retried automatically (after 10 minutes, at most 5 attempts) |
| Invalid or unsafe input (including header-injection attempts) | Error | No | No |
| Hidden anti-spam field filled (bots) | "Query Received" | No | No |
| More than 5 in 15 minutes, or 20 in 24 hours, from one visitor | Error (HTTP 429) | No | No |
| More than 300 across the whole site in 24 hours | Error (HTTP 429) | No | No |
| Database unavailable | Error | No | No |

The visitor is told "received" whenever the enquiry is safely stored. Reporting failure for a stored enquiry would cause people to resubmit and create duplicates.

## Delivery status values (`gi_query_submissions.delivery_status`)

- `legacy`: received before this change. Never re-sent automatically.
- `pending`: stored, not yet sent.
- `sending`: a server instance is sending it now. If this lasts more than 2 minutes, it is treated as abandoned and retried.
- `sent`: notification delivered.
- `failed`: last attempt failed. `delivery_error` holds a content-free code such as `gmail_http_503`.

To find enquiries whose email never arrived, run this against the production database (read-only):

    SELECT id, created_at, delivery_attempts, delivery_error
    FROM gi_query_submissions
    WHERE delivery_status IN ('failed', 'pending', 'sending')
    ORDER BY created_at;

## Privacy

- Rate limiting stores only a keyed hash (HMAC-SHA256 with `SESSION_SECRET`) of the visitor address, never the address. Rows older than 2 days are deleted automatically.
- Logs record the enquiry ID and delivery outcome only. They never record names, emails, companies or messages.

## Database migration

- Forward: `lib/db/migrations/0001_enquiry_delivery_tracking.up.sql`. Additive and safe to run more than once. Existing enquiries are preserved and marked `legacy`.
- Rollback: `lib/db/migrations/0001_enquiry_delivery_tracking.down.sql`. Deploy the previous application version first. Enquiry rows are kept; only the delivery-tracking columns and the rate-limit table are removed.
- The Drizzle schema matches the SQL exactly. `drizzle-kit push` after the SQL reports "No changes detected". Replit's post-merge `pnpm --filter db push` applies the same change to development without any interactive prompt.
- Tested: applied twice (idempotent), rollback restores the exact pre-change schema, and a pre-existing enquiry survives both directions.

Production: Replit applies development schema changes to the production database when the app is republished. If it does not, run the forward SQL on the production database from the Replit Database pane **before** republishing. Take a backup first.

## Post-deployment verification (no real emails)

1. **Client identification (`TRUSTED_PROXY_HOPS`, default 2).** Send six honeypot submissions (`"website": "x"`) from one machine within 15 minutes, each with a different fake first entry in `X-Forwarded-For`. Expected: submissions 1–5 return 201 and the 6th returns 429. The visitor is then identified correctly and spoofing does not bypass the limit. Next, from a different network (for example a phone on mobile data), submit once with the honeypot. Expected: 201, which confirms visitors are not grouped together.
   - If the 6th returns 201: the limit is being bypassed, so lower `TRUSTED_PROXY_HOPS` to 1 in production secrets and repeat.
   - If the phone is blocked: visitors are grouped together, so raise `TRUSTED_PROXY_HOPS` to 3 and repeat.
2. **One authorised real enquiry** from the owner, after step 1. Expected: one email with the subject "New Generational Intelligence website enquiry", and one row with `delivery_status = 'sent'`.
