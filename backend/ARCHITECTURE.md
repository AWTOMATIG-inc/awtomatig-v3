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
| **Auth** | Employees only. Email and password, sessions in an httpOnly cookie. **2FA is planned but switched off for now (B10).** Library: Better Auth (B9). Sessions are database rows behind an httpOnly cookie, not JWTs. No public sign-up. |
| **Authorization** | Role-based, with permissions of the form `module.resource.action` (`inventory.stock.adjust`). Roles are data in `core.`; checks happen in the service layer. |
| **Validation** | zod at every edge (HTTP input, env, event payloads). DTO types derive from the schemas. |
| **API style** | REST + JSON under `/api/v1`, with an OpenAPI spec generated from code. Frontend and admin generate their types from it. |
| **Errors** | One shape: `{ code, message, details? }`. Domain errors are typed classes mapped to HTTP codes in one place. |
| **Background jobs** | pg-boss (Postgres-backed). No Redis until a measured need exists. |
| **Files** | Cloudflare R2 (S3-compatible) through `shared/storage/` (`StorageService`: put, delete, head, signed GET link). Postgres stores metadata and the object key only. The private bucket is never public; files are opened through short-lived signed links (B12). |
| **Config** | Environment variables validated at boot with zod; the app refuses to start on a missing or invalid value. `.env.example` stays current. |
| **Logging** | Structured JSON with a request id. No secrets, passwords or personal data in logs. |
| **Security** | Rate limiting on public endpoints, CORS limited to our origins, Helmet headers, parameterised queries only, uploads validated by type and size. |

## 4. Website integration

- The contact form's Server Action (`frontend/`, running on the same VPS) posts to `POST /api/v1/crm/leads` server to server with the shared `x-ingest-key` (`LEAD_INGEST_KEY`); the backend validates, stores the lead and returns its id. It sends no email: the website emails the team and the visitor itself (frontend D59 and D60), so the working Gmail app password stays in `frontend/.env`. The browser never calls the backend, so the website's CSP does not change.
- CMS content is read by the website at build time or by revalidation, so pages stay static.
- The public API surface is deliberately tiny: the form and read-only CMS.

## 5. Testing approach

Unit tests for `domain/` and `service/`; integration tests against a real Postgres (not mocks) for `repo/` and the HTTP layer; a small end-to-end set for critical flows (login, lead, invoice, stock).

## 6. Open items

- [x] ~~CMS: Payload CMS vs a custom `cms` module~~: custom, started with case studies (B16). Payload would add a second framework with its own tables and auth.
- [x] ~~Auth library~~: Better Auth (B9). Company SSO is still open.
- [ ] Auth follow-ups: password reset and "email a new employee" need an email sender; account lock-out after repeated failures (today: rate limits only); 2FA (B10); an admin screen to create employees and manage roles.
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
| B9 | 2026-10-29 | Authentication is Better Auth with cookie sessions (not JWT), roles as data | Single backend, small known user base: a session row can be revoked at once and the cookie is httpOnly. JWTs would add nothing but slower revocation. Better Auth covers password hashing, sessions, 2FA and rate limits, and keeps users in our own Postgres (`core` schema). Details in MEMORY.md. |
| B10 | 2026-10-29 | Two-factor authentication is removed for now | Decided by the project owner to simplify the first release. Supersedes the 2FA part of B9. It is a requirement in RULES.md section 5 and must come back before real data or production use; the plan is in MEMORY.md open items. |
| B11 | 2026-10-29 | The `crm` module only stores and serves leads; the website keeps sending the emails; the website's Server Action calls it server to server with a shared key | Matches the working email setup and keeps the app password out of the backend. The key stops anyone from filling the CRM through the public `/api` path of the admin domain. Idempotent by `submissionId`. Supersedes the earlier idea that the backend "notifies staff". |
| B12 | 2026-11-02 | File storage is Cloudflare R2 behind `shared/storage/`; the website-submission key guard moved to `shared/auth/` as `IngestKeyGuard` | Recruitment (resumes) is the first module needing files. R2 needs the checksum settings in the storage service or presigned links break. The key guard is now shared by `crm` and `recruitment`; the env name `LEAD_INGEST_KEY` stays to avoid a secret change on the VPS. Plan: ../RECRUITMENT_PLAN.md. |
| B13 | 2026-11-02 | Recruitment jobs: status, type and work mode are `text` + `check` columns (not Postgres enums); "accepting applications" is derived, never stored; a `POST /:id/publish` endpoint was added to the plan; questions are replaced as one ordered list and archived, never deleted | Matches `crm` and keeps a new value a one-line migration. A stored flag would drift from the deadline, so one pure function decides. A draft needs a way to be published after editing. Archiving keeps later applications readable. Details in `src/modules/recruitment/README.md`. |
| B14 | 2026-11-02 | Applications: one per job for each normalised email and phone (unique indexes are the final guard); the resume is uploaded to the private bucket first, then every row is written in one transaction, and the file is deleted again if that fails; the multipart request is read in `api/` with a 5 MB streaming cap, and the service validates the content; public job endpoints return an allow-listed shape; a retry with the same `submissionId` returns the stored application even after the job closes | A duplicate must be refused before any upload, but a simultaneous double submit can only be stopped by the database. Uploading first means a stored application always has its file; the cost is a rare orphan object, which is logged. A retry must never turn a success into an error. Details in `src/modules/recruitment/README.md`. |
| B15 | 2026-11-02 | Resume keys are `career/<job title>/<candidate's file name>.pdf`, not ids; uploads use R2's conditional put (`If-None-Match: *`, `StorageService.putIfAbsent`) and fall back to the same name plus a short, then the full, application id when a name is taken. Supersedes the "keys hold only ids" part of B12 and B14 | The owner wants to browse the bucket by job and see the real file names. An exact name alone would let one candidate's `resume.pdf` replace another's, so overwriting is refused by the storage layer itself (checked against the real bucket: R2 answers 412). Title and name are made safe before they enter a key, and the key is stored with the application, so a later title change cannot orphan a file. Trade-off, accepted: the key can contain a person's name through their file name, so keys stay out of logs, the audit log and API responses. |
| B16 | 2026-11-04 | The CMS is a custom `cms` module in this app (not Payload), starting with case studies; its images live in the **public** R2 bucket `awtomatig-public` under `case-study/<slug>/image<N>.<ext>`, served from `R2_PUBLIC_BASE_URL`, and a public file is never overwritten | One auth, one audit log and one database convention, as the open item leaned. The slug is fixed at creation and is both the page address and the image folder, so a later title change cannot orphan files. A CDN may keep serving the old bytes of a reused URL, so replacing an image uploads a new numbered file and deletes the old one afterwards. Case study text and images are public once published, so no signed links. Details in `src/modules/cms/README.md` and ../CASE_STUDY_PLAN.md. |
| B17 | 2026-11-05 | Client testimonials live in the same `cms` module (table `cms.testimonials`), with an optional company logo in the public bucket under `testimonial/<id>/logo<N>.<ext>`, named by the row id (no slug); the image checks and numbered, never-overwriting storage are shared with case studies in `PublicImageStore`; the public endpoint returns an allow-listed shape, at most 50; publishing needs the client's recorded agreement, enforced by the service and by a database check | One module for the website's managed content (B16), no new dependency. A testimonial has no page, so an invented slug would only add a "taken" error; the id never changes, so files never move. A name and role on a public page is personal data, so consent is a hard rule, not a convention. Logos are PNG, JPEG or WebP only: SVG can carry scripts. Details in `src/modules/cms/README.md` and ../TESTIMONIALS_PLAN.md. |
| B18 | 2026-11-05 | The website's trust numbers are a fixed set of nine slots in the `cms` module (table `cms.site_metrics`, migration `0006_cms_site_metrics`: `key` primary key, `value`, `updated_at`, `updated_by`). The slots, their field titles, kind (`stat` or `rating`) and the pages and sections that show each one are a **catalog constant** in `domain/site-metric.ts`, not a table; a slot with no saved row shows its catalog default, so a missing seed never breaks the website. The value format is checked by kind: a stat is whole digits plus an optional `+`, `%`, `k` or `M` (the website's count-up reads `^(\D*)(\d+)(\D*)$`), a rating is 0 to 5 with one decimal. No draft step: an edit is live at once and calls the website's refresh (`?tag=site-metrics`) only when the value changed. Audit `cms.site_metric.updated` holds the key and the old and new value. Permissions `cms.metric.read` / `cms.metric.update`. | Each slot is wired to a place in the website's code, so the set cannot be user-defined. The catalog lets the admin show where an edit goes live without knowing the website. Plan in `SITE_METRICS_PLAN.md`. |
| B19 | 2026-11-05 | The website's FAQs are **one shared list** in the `cms` module (table `cms.faqs`, migration `0007_cms_faqs`: `question` 1 to 200, `answer` 1 to 1000 plain text, `status`, `sort_order`, with database checks for each). There is no page column: every page that shows the shared FAQ section displays the whole published list, and the cleaning landing page keeps its own questions in code and never calls this. Draft and publish, manual order, at most 100 published (a 101st publish is a 409; the public list is capped at 100 too). **Unlike case studies and testimonials, an FAQ can be deleted in any state**, because no consent or stored file is behind it. The public endpoint returns only `{ question, answer }`. Audit holds ids and field names, never the text. Permissions `cms.faq.read` / `.create` / `.update` / `.delete`. | The owner wants one list edited in one place and shown wherever the section is placed (Contact now, Home or others later), with the landing page untouched. A per-question page choice was dropped after that answer. Same delivery as testimonials (public endpoint, `?tag=faqs` refresh). Plan in `FAQ_PLAN.md`. |
| B20 | 2026-11-06 | HR is a new `hr` module with its own Postgres schema (`hr.employees`, `hr.employment_records`, `hr.departments`, sequence `hr.employee_no_seq`, view `hr.employees_current`; migration `0008_hr_employees`). **Employment details (designation, role type, work mode, salary, department, manager) live only in the timeline** (`employment_records`, one row per stint holding the complete state from `effective_from`); `employees` holds the person and the leaving date. **"Current" is never stored**: the view picks the newest record dated on or before today in Dhaka (the earliest while the employee has not started), so future-dated changes need no job and nothing can go stale. Records are added and deleted, never edited. The EMP ID is a sequence integer shown as `EMP-0001`. Salary and the full NID need the separate permission `hr.sensitive.read` and are left out of the response itself without it; salary is nullable. The employment period is calculated, and the leaving date counts as a day worked. Validation errors are 400. **Documents** (`hr.employee_documents`, migration `0009_hr_employee_documents`, at most 50 per employee) are files in the **private** R2 bucket under `hrm/employees/<EMP-0001>-<name-slug>/<type>/<file>`, with the exact key saved in the row so a rename never loses a file; the type is read from the file's bytes, an upload never replaces a file, links last 5 minutes and every link is audited, and they need their own permissions (`hr.document.read` / `hr.document.manage`) | The timeline is the history, and a stored copy of "current" would go stale every night once scheduled changes exist; one source of truth removes that bug class, and the lookup is an indexed query at this company size (a materialised table can sit behind the same view name if it ever grows). Plan and phases in `HR_PLAN.md`; details in `src/modules/hr/README.md`. |
