# AWTOMATIG: Root Memory

Cross-folder context: where the whole system stands, decisions that affect more than one folder, open items and the change log. Folder-level detail is in `frontend/MEMORY.md`, `backend/MEMORY.md` and `admin/MEMORY.md`. Read this and the folder's memory before starting work, and update it when you decide, ship or resolve something.

- **System design:** [ARCHITECTURE.md](ARCHITECTURE.md) (decisions S1 to S4)
- **Rules:** [RULES.md](RULES.md)

---

## 1. Current status

_Last updated: 2026-10-28_

| Area | Status | Location |
| --- | --- | --- |
| Marketing website | Built; see its own memory for sections and open items | `frontend/` |
| Backend (CMS + ERP API) | Scaffolded (NestJS 11 + Fastify, Drizzle, zod, health, OpenAPI, boundary check); lint, build and 9 tests pass; **not yet run against a live PostgreSQL**; no business module | `backend/` |
| Admin / ERP UI | Scaffolded (Next.js 16): website tokens copied with a sync check, shell, dashboard, UI primitives, typed API client; sign-in disabled, fails closed; no module screens | `admin/` |
| Repo move into `frontend/` | Committed (`5dc0e0e`); root `.gitignore` hides leftover root build artifacts | repo root |

**Next up:** run the backend against a live PostgreSQL and apply a first migration, then build `shared/auth`, `rbac` and `audit` and the `crm` module for the website's contact form. Then wire `admin/` sign-in and build its first screens (CRM leads).

## 2. Cross-folder decisions

See the decision log in [ARCHITECTURE.md](ARCHITECTURE.md) (S1 to S4). Short form: internal-only single tenant, three folders, OpenAPI as the contract, common docs at the root and folder docs in each folder.

## 3. Open items

- [x] Commit the move of the website into `frontend/` (`5dc0e0e`).
- [ ] Update `frontend/README.md` and CI/deploy scripts for the new paths if they reference the old root.
- [ ] System-level open items are listed in ARCHITECTURE.md section 5.

## 4. Change log

Newest first.

| Date | Change |
| --- | --- |
| 2026-10-28 | The website contact form now sends email itself (Next.js Server Action + Gmail SMTP, `frontend/MEMORY.md` D59) as a stopgap until the backend `crm` module is live; move it there then. |
| 2026-10-28 | Added a root `.gitignore` so leftover root build output (`node_modules/`, `.next/`, `.env`, `.codegraph/`) from before the move stops showing as untracked. |
| 2026-10-28 | **Admin scaffolded** in `admin/` (see `admin/MEMORY.md`): Next.js 16, the website's tokens copied with a lint-enforced sync check, shell, dashboard, shared UI primitives, typed client from `backend/openapi.json`, a disabled sign-in and a fail-closed session seam. Nothing committed. |
| 2026-10-28 | **Backend scaffolded** in `backend/` (see `backend/MEMORY.md`): NestJS 11 on Fastify, Drizzle + pg, zod-validated config, single error shape, request ids, health endpoints, OpenAPI export, dependency-cruiser boundary rules, tests. Nothing committed. |
| 2026-10-28 | **`AGENTS.md` and `CLAUDE.md` are now common and live at the root** (repo map, read-first table, working rules; imports the root docs). The old frontend-only content of `frontend/AGENTS.md` moved to `frontend/RULES.md`; `frontend/AGENTS.md` keeps only the `next dev`-managed Next.js notice, and each folder has a thin `CLAUDE.md` loading its own docs. Wrote `admin/DESIGN.md`. |
| 2026-10-28 | Added root `ARCHITECTURE.md`, `RULES.md` and `MEMORY.md`; created `backend/` and `admin/` docs. Split rule: common docs at the root, folder-specific docs in their folder, a `MEMORY.md` in each. |
