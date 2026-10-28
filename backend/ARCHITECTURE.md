# Backend: Architecture

The API behind the website and the admin app: CMS content and the ERP modules. System-wide context is in the root [ARCHITECTURE.md](../ARCHITECTURE.md). Coding rules are in [RULES.md](RULES.md). Status and history are in [MEMORY.md](MEMORY.md).

Status: **scaffolded** (framework, config, database access, error shape, logging, health, OpenAPI and the boundary check are in place and tested). No business module exists yet. Run instructions are in [README.md](README.md).

---

## 1. Database

**Decided: plain PostgreSQL on our own VPS.** PocketBase (SQLite) is out because it is too limited for ERP transactions. Supabase is out because it adds a vendor and puts business rules into RLS policies. The team has Postgres operations experience, so the ops cost is accepted.

- **Access layer:** Drizzle ORM (SQL-first, typed). Raw SQL is fine for reports.
- **Migrations:** versioned SQL files in git, applied by CI or a deploy step. The schema is never changed by hand in any environment.
- **One Postgres schema per module** (`cms.`, `crm.`, `inventory.`, `accounting.`, `hr.`, plus `core.` for auth and audit). A module's tables are private to that module.
- **Types:** primary keys are UUIDv7, timestamps are `timestamptz`, money is `numeric(19,4)` and never a float. Store the currency next to every amount.
- **Every table:** `id`, `created_at`, `updated_at`. Business tables also get `created_by` / `updated_by`. Soft delete (`deleted_at`) only where history matters; decide per table and note it in the module README.
- **Audit:** an append-only `core.audit_log` (who, what, when, before/after) for every ERP write that matters: money, stock, permissions, HR data.
- **Backups (non-negotiable):** continuous WAL archiving with point-in-time recovery (`pgBackRest` or `wal-g`) to off-server storage, plus a **restore test every month**. Postgres listens on localhost or a private network only.
- **Environments:** separate local, staging and production databases.

## 2. Modular monolith

**Decided: modular monolith in TypeScript, not MVC.** Code is grouped by business domain, not technical type. One deployable app, one database, strict boundaries between modules. A module can be split into its own service later if it ever needs to scale alone.

**Framework: NestJS** with the Fastify adapter (its module system maps onto this design and enforces conventions across developers). Node LTS, TypeScript `strict`.

```
backend/
  src/
    main.ts
    modules/
      cms/            # pages, case studies, testimonials, media metadata, SEO fields
      crm/            # leads (website contact form), clients, contacts
      inventory/
      accounting/
      hr/
        hr.module.ts
        api/          # controllers + DTOs (zod); HTTP only
        service/      # use cases; the module's public interface lives here
        domain/       # entities and business rules; no framework, no DB imports
        repo/         # Drizzle queries; the only code touching this module's tables
        schema.ts     # this module's tables
        events.ts     # events this module publishes
        README.md     # what it owns, its public API, its tables
    shared/           # cross-cutting kernel
      auth/  rbac/  audit/  events/  errors/  config/  db/  jobs/  storage/
  drizzle/            # generated migrations
  test/
```

**Layer flow inside a module:** `api → service → domain` and `service → repo`. `domain` imports nothing from the framework or the database.

**Boundaries between modules:**

1. Module A uses module B only through B's exported service interface or through events. It must not import B's `repo/` or `schema.ts` or query B's tables.
2. No foreign keys across module schemas, except to `core.` (users, audit). Reference other modules by id and look them up through their service.
3. Cross-module reactions use domain events (`invoice.paid`, `stock.adjusted`), published after the transaction commits. Start with an in-process bus; move to pg-boss when a handler needs retries.
4. `shared/` holds only cross-cutting infrastructure, never business logic. If two modules need the same business concept, one module owns it and the other asks it.

These rules are enforced in CI (see [RULES.md](RULES.md), "Module boundaries").

**Transactions:** a use case that changes data runs in one database transaction. Service calls across modules inside one request may join the same transaction (passed explicitly), since everything shares one database. Slower or less critical reactions go through events or jobs.

## 3. Cross-cutting concerns

| Concern | Decision |
| --- | --- |
| **Auth** | Employees only. Email and password plus mandatory 2FA, sessions in an httpOnly cookie. Library: Better Auth (**Open**, confirm; company SSO if one exists). No public sign-up. |
| **Authorization** | Role-based, with permissions of the form `module.resource.action` (`inventory.stock.adjust`). Roles are data in `core.`; checks happen in the service layer. |
| **Validation** | zod at every edge (HTTP input, env, event payloads). DTO types derive from the schemas. |
| **API style** | REST + JSON under `/api/v1`, with an OpenAPI spec generated from code. Frontend and admin generate their types from it. |
| **Errors** | One shape: `{ code, message, details? }`. Domain errors are typed classes mapped to HTTP codes in one place. |
| **Background jobs** | pg-boss (Postgres-backed). No Redis until a measured need exists. |
| **Files** | S3-compatible storage (MinIO on the VPS, or Cloudflare R2). Postgres stores metadata and the object key only. |
| **Config** | Environment variables validated at boot with zod; the app refuses to start on a missing or invalid value. `.env.example` stays current. |
| **Logging** | Structured JSON with a request id. No secrets, passwords or personal data in logs. |
| **Security** | Rate limiting on public endpoints, CORS limited to our origins, Helmet headers, parameterised queries only, uploads validated by type and size. |

## 4. Website integration

- The contact form posts to `POST /api/v1/crm/leads`, which validates, stores a lead, rate-limits and notifies staff. This replaces the website's `mailto:` fallback (frontend D47). When it ships, update `connect-src` in the frontend CSP (`frontend/next.config.ts`).
- CMS content is read by the website at build time or by revalidation, so pages stay static.
- The public API surface is deliberately tiny: the form and read-only CMS.

## 5. Testing approach

Unit tests for `domain/` and `service/`; integration tests against a real Postgres (not mocks) for `repo/` and the HTTP layer; a small end-to-end set for critical flows (login, lead, invoice, stock).

## 6. Open items

- [ ] **CMS: Payload CMS vs a custom `cms` module.** Leaning custom, so there is one auth, one audit log and one database convention. Payload is faster to start but adds a second framework with its own tables and auth.
- [ ] Auth library (Better Auth vs alternatives) and any SSO requirement.
- [ ] Accounting design (double-entry ledger) before any money screen exists.
- [ ] ERP module order and scope.

## 7. Decision log

Newest last. Supersede, never rewrite.

| # | Date | Decision | Why |
| --- | --- | --- | --- |
| B1 | 2026-10-28 | PostgreSQL on our own VPS | Team has Postgres ops experience; no vendor lock-in or per-usage cost; ERP needs real transactions. PocketBase and Supabase were rejected. |
| B2 | 2026-10-28 | Modular monolith in TypeScript, not MVC | Domain grouping keeps a feature in one place and limits coupling as modules grow; one deployable keeps transactions simple. |
| B3 | 2026-10-28 | NestJS with the Fastify adapter | Its modules enforce the boundaries from B2 across developers. |
| B4 | 2026-10-28 | Drizzle ORM, SQL migrations in git, one schema per module | Typed, close to SQL, and a module's tables stay private. |
| B5 | 2026-10-28 | pg-boss for jobs, no Redis | Postgres is already there; add Redis only on measured need. |
| B6 | 2026-10-28 | Drizzle chosen over Prisma (confirmed after comparing both) | Each module imports only its own tables, so module boundaries are enforced by imports. Prisma's single generated client would expose every table to every module. |
| B7 | 2026-10-28 | Scaffold pinned to NestJS 11 and TypeScript 5.9; `fastify` overridden to `^5.12.7` | `nestjs-zod` and `@nestjs/swagger` 11 do not yet support Nest 12 or TypeScript 6+. The override removes known Fastify advisories. Details in MEMORY.md. |
| B8 | 2026-10-28 | Module boundaries are enforced in `npm run lint` by dependency-cruiser | A rule in prose drifts. `.dependency-cruiser.cjs` fails the build on cross-module imports of `repo/`, `domain/`, `api/` or schema, on a framework import in `domain/`, and on `drizzle-orm` or `pg` outside `repo/`. |
