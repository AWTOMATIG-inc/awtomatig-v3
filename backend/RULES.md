# Backend: Rules

Rules for everyone (and every AI agent) working in `backend/`. They add to the root [RULES.md](../RULES.md). Reasons are in [ARCHITECTURE.md](ARCHITECTURE.md). "Must" is enforced in review or CI; "should" needs a reason to skip.

---

## 1. Code style

- No default exports (except where a framework requires one). Named exports only.
- File and folder names are `kebab-case` (`stock-adjustment.service.ts`). Classes and types are `PascalCase`.
- Domain code takes plain data in and returns plain data out.

## 2. Modules

- **Must** follow the module layout in ARCHITECTURE.md section 2 (`api/ service/ domain/ repo/ schema.ts events.ts README.md`).
- Layer rules, all **must**:
  - `api/` handles HTTP only: parse, call one service method, return. No business logic, no queries.
  - `service/` holds use cases and authorization checks, and opens transactions.
  - `domain/` imports no framework and no database code.
  - `repo/` is the only place that touches the module's tables.
- **Module boundaries (must):**
  - Never import another module's `repo/`, `schema.ts` or `domain/` internals. Use its exported service interface or events.
  - Never query or join another module's tables, and never add a foreign key to another module's schema (a reference to `core.` is allowed).
  - `shared/` contains infrastructure only, with no business rules.
  - CI runs a dependency check (`dependency-cruiser` or an equivalent ESLint rule) that fails on a violation.
- A new module comes with its own Postgres schema, its Nest module, its permission list and its README.

## 3. Database

- **Must:** every schema change is a new migration file in git. Never edit an applied migration. Never change a database by hand, production included.
- **Must:** migrations are backward compatible with the previous app version (add before use; remove only after nothing reads it). Destructive changes (drop, rename, type change) are split across at least two deploys.
- Money is `numeric(19,4)` with a currency column. Never use `float`, `real` or JS floating-point arithmetic for money; use a decimal library.
- Timestamps are `timestamptz` in UTC. Primary keys are UUIDv7.
- Every table has `created_at` and `updated_at`; business tables also have `created_by` / `updated_by`.
- Tables and columns are `snake_case`, tables plural (`stock_movements`). Add a foreign key and an index for every reference you query by.
- A write that must succeed or fail as a unit runs in one transaction. Never leave a half-written state.
- Anything that changes money, stock, permissions or HR data **must** write an audit entry in the same transaction.
- No `SELECT *` in application code. No string-built SQL: parameters only.
- Slow or large queries get an `EXPLAIN ANALYZE` in the PR description before merge.

## 4. API

- Everything is under `/api/v1`. A breaking change gets a new version, not a silent edit.
- Validate all input with zod at the edge. Never trust the client's types, ids or roles.
- Every endpoint declares the permission it needs (`module.resource.action`). An endpoint without one is public and must be called out in review.
- Errors use the single shape `{ code, message, details? }`. Throw typed domain errors; never leak stack traces, SQL or internal ids.
- List endpoints are paginated with a maximum page size. No unbounded queries.
- Mutations a client may retry (payments, lead submission) accept an idempotency key.
- The OpenAPI spec is generated from code and must be current in every PR that changes an endpoint.

## 5. Security

- Hash passwords with Argon2id (or the auth library's default). Enforce 2FA for every employee account (**currently switched off, decision B10; it must be back before production use with real data**).
- Authorization is checked in the service layer, not only in controllers or the UI.
- Public endpoints (the contact form) are rate-limited and validated, and reveal nothing about internal state.
- Uploads: check type, size and name; store outside the web root under generated keys.
- Log ids, not content.

## 6. Testing

- `domain/` and `service/` have unit tests. A new business rule **must** come with a test that fails without it.
- `repo/` and HTTP endpoints are tested against a **real Postgres** (a throwaway container), not a mock.
- A bug fix starts with a failing test that reproduces it.
- Critical flows (login, lead capture, stock adjustment, invoice posting) have end-to-end coverage.
- Tests are deterministic: no real network, and inject the clock.

## 7. Operations

- Backups use WAL archiving with point-in-time recovery to off-server storage. **Restore is tested monthly**; record the date in the ops log.
- Postgres and the API are not reachable from the public internet; only Nginx is.
- Production deploys: CI green, migration applied first, then the new app. Every deploy can be rolled back.
- Staging mirrors production's configuration. Test migrations there with a recent masked copy of production data.

## 8. Memory

- **Must:** keep `MEMORY.md` as the detailed record of the work in this folder (status, decisions and why, gotchas, open items, a dated change log with what was verified), and add the one-line overview entry to the root `../MEMORY.md` in the same change (root rules, section 1).
