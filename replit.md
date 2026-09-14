# Generational Intelligence

A public software portfolio backed by an explicitly approved snapshot, with a separate development-only editorial Studio.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Keep development and production environment values in their separate Replit environment scopes. Never copy secret values into source files.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/generational-intelligence` — public web app at `/`
- `artifacts/gi-studio` — development-only private Studio at `/studio/`
- `artifacts/api-server` — shared API; production exposes public/query endpoints only
- `artifacts/api-server/src/content/published-site.json` — approved snapshot embedded into a deployment
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema` — development CMS and snapshot schema

## Architecture decisions

- The custom domains belong only to the published root web artifact; never point DNS at a `.replit.dev` development URL.
- The Studio has no production service. Production also returns `404` for every `/api/studio/*` request.
- Drafts live only in the development database. Public production reads only `published-site.json`, which changes through an intentional Studio publish or rollback and becomes live only after republishing.
- Approved uploaded public assets are copied into the public artifact during Studio publish; private notes and supporting files are never exported.
- `www.generational-intelligence.com` is canonical. The apex hostname redirects there in the production public client.

## Product

- Public company and project presentation with a query form
- Development-only Studio with direct sandbox access for project CRUD, editorial review, approved uploads, ordering, preview, publishing, snapshots, and rollback

## User preferences

- Do not publish or connect custom domains without explicit user instruction.
- Keep the Replit development sandbox separate from the public deployment.
- The development Studio does not require sign-in; its privacy boundary is the private Replit sandbox. Production must continue blocking all Studio UI and API access.

## Gotchas

- Never restore a production section to the Studio artifact.
- Never add a production fallback from the approved snapshot to mutable project rows.
- Publishing content in Studio prepares the next deployment snapshot; it does not update the live deployment by itself.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
