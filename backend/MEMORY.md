# Backend: Memory

The detailed record of the work done in `backend/`: status, decisions and why, gotchas, open items and the dated change log (what changed, what was verified). Read it before starting work, and update it when you decide, build, fix, clean up or resolve something. The one-line overview of each change goes in the root [MEMORY.md](../MEMORY.md).

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) (decisions B1 to B11)
- **Rules:** [RULES.md](RULES.md)
- **How to run it:** [README.md](README.md)
- **System context:** [../ARCHITECTURE.md](../ARCHITECTURE.md), [../MEMORY.md](../MEMORY.md)

---

## 1. Current status

_Last updated: 2026-10-29_

| Area | Status | Location |
| --- | --- | --- |
| Architecture and rules | Written | this folder |
| Project scaffold (NestJS 11 + Fastify, TypeScript strict, ESLint, Prettier, Jest) | ✅ Built; `npm run lint`, `typecheck`, `build` and `test` (9 tests) pass | this folder |
| Config validation | ✅ zod, fails at boot | `src/shared/config/` |
| Database access (pg pool + Drizzle, column helpers) | ✅ Built; verified against the local PostgreSQL 16 and on the VPS (PostgreSQL 16.15, `/api/v1/health` returns `database: up`) | `src/shared/db/` |
| Error shape, structured logging, request id, rate limiting, CORS, security headers | ✅ Built and tested | `src/shared/errors/`, `logging/`, `src/bootstrap.ts` |
| Health endpoints (`/live`, `/ready`) | ✅ Built | `src/shared/health/` |
| OpenAPI contract (`openapi.json`, dev docs UI at `/api/docs`) | ✅ Built | `src/shared/openapi/`, `openapi.json` |
| Module-boundary check in lint | ✅ Built; rules checked with deliberate violations | `.dependency-cruiser.cjs` |
| `shared/auth`: Better Auth (email + password, httpOnly cookie sessions; **2FA removed for now, B10**), global guard, `@Public` / `@RequirePermission`, `GET /auth/session` | ✅ Built; verified against the local PostgreSQL 16 (sign-in, session, sign-out, wrong password, closed sign-up, cross-origin 403) and by `test/auth.e2e-spec.ts` | `src/shared/auth/` |
| `shared/rbac` (roles as data, `module.resource.action` permissions with wildcards) and `shared/audit` (`core.audit_log`) | ✅ Built; roles come from the seed only, no screen or API to manage them yet | `src/shared/rbac/`, `src/shared/audit/` |
| `shared/` kernel: events, jobs, storage | Not started | `src/shared/` |
| `crm` module (website contact form to leads): public ingest with a shared key, paged list, search, status filter, detail, status and notes update, dashboard stats | ✅ Built; verified against the local PostgreSQL 16 and by `test/crm.e2e-spec.ts` (13 tests) and 17 unit tests; sends no email | `src/modules/crm/` |
| `cms` module | Not started, blocked on the CMS decision | `src/modules/cms/` |
| Migrations applied, backups | `0000_core_auth_rbac_audit` and `0001_crm_leads` applied to the local database and to the **production VPS database** (all 8 `core` tables and `crm.leads` seen); later migrations run on every deploy; backups not provisioned | `drizzle/` |
| First administrator | `npm run seed:admin` (idempotent) creates the admin role and user from `SEED_ADMIN_*`; **run on the VPS**, sign-in at admin.awtomatig.com works | `src/seed-admin.ts` |
| Production deployment | ✅ **Live on the VPS** (2026-10-29): PM2 `awtomatig-api` on 127.0.0.1:4000, database `awtomatig` on 127.0.0.1:5432 (both loopback only, checked with `ss`); the website sends inquiries to it and they reach the dashboard; the VPS-only `deploy.sh` now builds, migrates and restarts the backend when `backend/` changes | VPS `~/awtomatig-v3` |

## 2. Key decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) section 7 (B1 to B7). Record new decisions there, and the reasoning that does not fit in a table row here.

- **NestJS 11, not 12.** NestJS 12 is the current release, but `nestjs-zod` (5.5) and `@nestjs/swagger` 11 declare support for Nest 10 and 11 only. Move to 12 when `nestjs-zod` supports it.
- **TypeScript 5.9, not 7.** `@nestjs/swagger` supports TypeScript 5.5 and 6 only.
- **`fastify` is overridden to `^5.12.7`** in `package.json` because `@nestjs/platform-fastify` 11.2.8 pins 5.11.3, which has high-severity advisories. Remove the override when Nest ships a patched pin.

## 3. Gotchas

- **Nest DI needs value imports.** Do not turn on `consistent-type-imports`: it would turn an injected class into a type import and break `emitDecoratorMetadata`.
- **`@fastify/static` v10 is ESM-only**, which Jest cannot load. The dev docs UI therefore runs only when `NODE_ENV=development`, so tests and production never load it.
- **`nestjs-pino` ignores `autoLogging.ignore` on Fastify**, so quiet routes are silenced with `customLogLevel` returning `"silent"` instead (`logging.module.ts`).
- **The request id is Fastify's** (`genReqId` and `requestIdHeader` in `bootstrap.ts`), echoed in the `x-request-id` response header and used by the logs. Setting `genReqId` in the pino options has no effect.
- **The rate limiter's error goes through the normal filter**, so it comes back as `{ code: "TOO_MANY_REQUESTS", message }`.
- **Drizzle is created without a schema object on purpose**, so no shared object exposes every module's tables. Repos import their own module's tables.
- **`npm install` blocks install scripts** (esbuild and others). That is fine here: `drizzle-kit` and `nest build` ran without them.
- Remaining `npm audit` items are moderate or low, in dev tooling (`drizzle-kit`'s old esbuild, `@nestjs/cli`) and in `nestjs-zod` (`deepmerge`) and `@nestjs/swagger` (`js-yaml`). Re-check when those packages update.

- **ESM-only Better Auth in a CommonJS backend.** Better Auth 1.x ships ESM only. `tsconfig` uses `module` / `moduleResolution: nodenext` so TypeScript accepts it, `auth.factory.ts` loads it with a dynamic `import()` (the compiled output stays CommonJS, so it works on Node 22), and `npm test` runs Jest with `--experimental-vm-modules`. Do not call `npx jest` directly.
- **Better Auth turns its origin check off when `NODE_ENV=test`**, so the 403 `INVALID_ORIGIN` for a foreign `Origin` was checked by hand against the running server, not in the e2e test.
- **Check the generated migration for `CREATE SCHEMA`.** `drizzle-kit generate` emitted it for `crm` but not for `core` (`0000` starts with a hand-added `CREATE SCHEMA IF NOT EXISTS "core"`). Read the SQL before applying; a missing or duplicate line fails the whole migration. `drizzle-kit migrate` also hides the database error and just exits 1; run the SQL with `pg` to see it.
- **The client address is Fastify's, not the header's.** `AuthHandlerController` overwrites `x-forwarded-for` with `request.ip` (which honours `TRUST_PROXY`), so rate limits and the audit log cannot be spoofed. Set `TRUST_PROXY=true` behind Nginx.
- **Better Auth's own rate limit is in memory**, per process: fine for one PM2 instance, move it to the database before running several. Sign-in and change-password allow 10 a minute per address.
- **Hashing is Better Auth's default (scrypt)**, which RULES.md section 5 allows ("or the auth library's default").
- **The e2e suites share one database and run in parallel**, so each deletes only the rows it created (by its own run id). Never clean up with a wildcard that could match another suite's users.
- **`z.string().nullable()` in a response schema becomes an array in `openapi.json`** (a `nestjs-zod` quirk), so lead `notes` is returned as an empty string when there are none.
- **Search patterns are escaped** (`escapeLike`), so `%` and `_` typed into the search box match literally.
- **Dashboard days and weeks are cut in the caller's time zone** (`timeZone` query, validated as an IANA name); weeks start on Monday.
- **Keep `package-lock.json` in sync with `package.json`.** `npm ci` (used by `deploy.sh`) fails on any mismatch; the first VPS install failed on a missing `webpack` entry until the lockfile was regenerated (`npm install --package-lock-only`) and pushed. Do not run `npm install` on the VPS: it edits the lockfile there and the next `git pull` is blocked (fix: `git checkout backend/package-lock.json`).
- **A new required env var must be added to the VPS `backend/.env` before the merge.** `deploy.sh` does not touch `.env`; a missing variable stops the API at boot.
- **`drizzle-kit migrate` prints only "Using 'pg' driver" and no success line.** Check the tables with `psql ... -c "\dt core.*"` instead of waiting for a message.
- **The e2e test runs in the dev database** (the app role cannot create databases): it uses unique `e2e-…@test.invalid` users and deletes them.

## 4. Open items

See ARCHITECTURE.md section 6: CMS (Payload vs custom), auth library, accounting design, module order.

- [ ] Provision the staging and production Postgres on the VPS with WAL archiving and a first restore test.
- [x] ~~Run the stack against a live PostgreSQL~~: done locally, and on the VPS on 2026-10-29 (migrations applied, health `database: up`).
- [ ] Decide the host and path for the API (`api.awtomatig.com` or `/api` behind Nginx) and update the frontend CSP.
- [ ] CI pipeline (type-check, lint, tests, migrations on a throwaway Postgres, an `openapi.json` freshness check).
- [x] ~~Hide `/health/*` from the access log~~: done through `customLogLevel` (`/live` and `/ready` successes are silent; `/health` is logged).
- [ ] Add `events`, `jobs` (pg-boss) and `storage` as the first modules need them, not before.
- [x] ~~Deploy auth and CRM~~: done 2026-10-29. Generated secrets and `LEAD_INGEST_KEY` on the VPS, migrated, ran `seed:admin` once with the password passed inline (never written to `.env`).
- [ ] The administrator's password was chosen by hand at seed time. The admin has no change-password screen yet (`POST /auth/change-password` exists); until it does, a reset is `seed:admin -- --reset-password`.
- [ ] Password reset and new-employee invites need an email sender (Gmail SMTP exists for the website form, frontend D59).
- [ ] **Put 2FA back (B10) before real data or production use.** `backend/RULES.md` section 5 still requires it. Better Auth's `twoFactor` plugin does it; it needs a `two_factors` table, a `two_factor_enabled` column on `core.users`, a guard rule that blocks un-enrolled employees, and the admin screens (code step at sign-in, enrolment with a QR code). The git history of this change has the removed implementation.
- [ ] Employee management: create, disable (revoke sessions), assign roles, reset passwords. Until then these are database or seed operations.
- [ ] CRM follow-ups: delete a lead and a retention period for old leads, per-lead history, assign to an employee, CSV export, a limited "sales" role (`crm.lead.read` + `crm.lead.update`) once there are non-admin users.
- [ ] Audit more than sign-ins (password changes, role changes) as those features land.
- [ ] Company SSO, if one exists.

## 5. Change log

Newest first.

| Date | Change |
| --- | --- |
| 2026-10-29 | **Deployed to the VPS.** Followed the README steps: PostgreSQL role and database `awtomatig`, production `backend/.env` with generated secrets (mode 600), `npm install --include=dev` (the lockfile was out of sync, see Gotchas), build, migrations (all 8 `core` tables and `crm.leads` present), `seed:admin` with the password passed inline, PM2 `awtomatig-api`. Wired `LEAD_INGEST_KEY` and `CRM_API_URL=http://127.0.0.1:4000` into `frontend/.env` and confirmed `API_URL` in `admin/.env`. Verified: `/api/v1/health` returns `status ok, database up`; admin sign-in works; a website inquiry arrives; port 4000 and 5432 listen on 127.0.0.1 only. `deploy.sh` (VPS-only) now builds, migrates and restarts the backend when `backend/` changes; the first webhook deploy restarted `awtomatig-api` on its own. Not done: backups, the change-password screen, 2FA (B10). |
| 2026-10-29 | **VPS deployment steps written** in `README.md` ("Deploying to the VPS"): create the PostgreSQL role and database, the production `.env`, `npm ci --include=dev`, build, migrate, seed the first administrator without writing the password to a file, run under PM2 as `awtomatig-api` on 127.0.0.1:4000, wire the website and admin, and the per-deploy command line for `deploy.sh`. Not executed on the server yet. |
| 2026-10-29 | **CRM leads built (B11).** New `crm` module (`api/ service/ domain/ repo/ schema.ts`, README) and migration `0001_crm_leads` (`crm.leads`, with a unique `submission_id` for idempotency and a status check constraint). Endpoints: `POST /crm/leads` (public, needs the `x-ingest-key` header, constant-time check), `GET /crm/leads` (page, pageSize, status, q, sort, order), `GET /crm/leads/stats`, `GET /crm/leads/:id`, `PATCH /crm/leads/:id` (permissions `crm.lead.read` / `crm.lead.update`). Audit entries `crm.lead.captured` / `crm.lead.updated` hold ids only, written in the same transaction. New env `LEAD_INGEST_KEY` (32+ characters, required). `AuditService.record` accepts a transaction. Fixed a test race (auth e2e cleanup deleted other suites' users). Verified: typecheck, lint with boundaries, build, 52 tests (incl. 13 CRM e2e against PostgreSQL), live ingest through curl, `openapi.json` regenerated. |
| 2026-10-29 | **Cleanup of files not needed to run, migrate or deploy.** Squashed `0001_remove_two_factor` into a single `0000_core_auth_rbac_audit` (only because nothing had been deployed; the local database was reset, migrated and re-seeded, and `drizzle-kit check` passes). Audited `src/` and the dependencies: the only files nothing imports are the entry points (`main`, `openapi-export`, `seed-admin`), and `reflect-metadata`, `rxjs`, `pino` and `pino-http` are peers of NestJS and `nestjs-pino`, so nothing else was removed. Kept `docker-compose.dev.yml` (documented dev database). Git-ignored build output (`dist/`) is regenerated by builds and was left alone. |
| 2026-10-29 | **2FA removed for now (B10).** Dropped the Better Auth `twoFactor` plugin, the enrolment guard rule (`TWO_FACTOR_REQUIRED`, `@AllowPendingTwoFactor`), `twoFactorEnabled` in the session response, and the 2FA test steps. Because nothing had been deployed, the migrations were squashed into one clean `0000_core_auth_rbac_audit` that matches the schema (no `two_factors` table, no `two_factor_enabled` column); the local database was reset, migrated and re-seeded. Once a migration has been deployed, never squash: add a new one. Verified: typecheck, lint, build, 26 tests (including the real-PostgreSQL sign-in e2e), and a live sign-in, dashboard and sign-out through the admin app. |
| 2026-10-29 | **Authentication built (B9).** Better Auth 1.7 with Drizzle in a new `core` schema (`users`, `sessions`, `accounts`, `verifications`, `roles`, `role_permissions`, `user_roles`, `audit_log`; migration `0000_core_auth_rbac_audit`). Email and password (12+ characters, sign-up closed), 12-hour cookie sessions read from the database on every request, a global guard that makes every endpoint private unless `@Public()`, `@RequirePermission()`, `GET /api/v1/auth/session`, sign-in audit, rate limits, and `npm run seed:admin`. New env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. (It first shipped with mandatory TOTP 2FA, removed the same day.) |
| 2026-10-29 | **Shorter logs.** One line per request (`GET /api/v1/health 200 8ms`; `warn` for 4xx, `error` for 5xx), no headers, cookies or bodies; development prints it readably without pid, hostname or JSON fields, production keeps request id, method, url, status and duration as JSON. `/health/live` and `/health/ready` successes are not logged. Nest startup narration (modules initialised, routes mapped) is dropped; `Database connected` and `API listening` remain. Checked live against the local PostgreSQL in both modes; 12 tests pass. |
| 2026-10-29 | **`GET /api/v1/health`** added: API up, database up, uptime and timestamp (503 in the standard error shape when PostgreSQL does not answer); `/live` and `/ready` stay for monitors and deploys. 12 tests pass; the live success path is covered with a fake database, not yet a real one. |
| 2026-10-29 | **Startup database check.** `Database.onModuleInit` opens a connection when the app boots and logs `Database connected: host:port/db (PostgreSQL 16.x)`, or `Database connection failed: …` with PostgreSQL's reason. The password is never logged. A failure does not stop the app: `/api/v1/health/ready` reports the database as unreachable until it recovers. Checked against the local PostgreSQL 16: the failure path (wrong password) was exercised; the success line was not yet seen because the role's password did not match. |
| 2026-10-28 | **Backend scaffolded.** NestJS 11 on Fastify, TypeScript strict, zod config, pg + Drizzle (`Database`, `baseColumns`, `money`), a single error shape, pino logging with request ids, Helmet, CORS, rate limiting, health endpoints, OpenAPI export, dependency-cruiser boundary rules, Jest (unit + API tests), `docker-compose.dev.yml`. Verified: `typecheck`, `lint`, `build`, `test` (9 passing), a dev server boot (health, docs, 404, bad env), a sample migration, and the boundary rules against deliberate violations. No business module yet. |
| 2026-10-28 | Wrote `ARCHITECTURE.md`, `RULES.md` and this file. No code yet. |
