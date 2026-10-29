# AWTOMATIG: Root Memory

The overview of the whole system: one status row per folder, decisions and open items that affect more than one folder, and a short change log saying **which folder changed and what**. It holds no implementation detail: that lives in the folder's own memory (`frontend/MEMORY.md`, `backend/MEMORY.md`, `admin/MEMORY.md`), which is the detailed record of the work done there. Read this and the folder's memory before starting work. After any change, add a one-line entry here and the full detail in the folder's memory, in the same change (see [RULES.md](RULES.md) section 1).

- **System design:** [ARCHITECTURE.md](ARCHITECTURE.md) (decisions S1 to S4)
- **Rules:** [RULES.md](RULES.md)

---

## 1. Current status

_Last updated: 2026-10-29_

| Area | Status | Location |
| --- | --- | --- |
| Marketing website | Built; see its own memory for sections and open items | `frontend/` |
| Backend (CMS + ERP API) | Scaffolded plus **authentication** (Better Auth, roles, audit; 2FA removed for now; first migrations applied locally and verified against PostgreSQL 16); lint, build and 26 tests pass; no business module; **not deployed** | `backend/` |
| Admin / ERP UI | Scaffolded (Next.js 16): tokens with a sync check, shell, UI primitives, typed API client; **sign-in and sign-out work**; **first module screens: Leads (list, detail, status and notes) and a dashboard fed by real lead figures** | `admin/` |
| Repo move into `frontend/` | Committed (`5dc0e0e`); root `.gitignore` hides leftover root build artifacts | repo root |

**Next up:** deploy the backend to the VPS (set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `LEAD_INGEST_KEY`, migrate, seed the admin, change the seeded password) and add `CRM_API_URL` and `LEAD_INGEST_KEY` to the website's `.env`, so contact-form inquiries start landing in the dashboard. Until then the website only emails them.

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
| 2026-10-29 | **`admin/`:** the backend address (`API_URL`) is now required in `admin/.env` and no longer has a default in the code; the VPS `admin/.env` needs it before the next build. Details in `admin/MEMORY.md`. |
| 2026-10-29 | **`backend/`:** wrote the first-time VPS deployment steps (database and role, env, migrate, seed, PM2, wiring the website and admin) in `backend/README.md`. No code change; not yet run on the server. |
| 2026-10-29 | **`frontend/` and `admin/`:** text fields now show no focus color or ring at all (frontend D62; checkboxes, radios and chips keep a keyboard-only outline); **`admin/`:** the sign-in password field has a show / hide eye button. Details in each folder's `MEMORY.md`. |
| 2026-10-29 | **`admin/` and `frontend/`:** the admin's "Leads" screen is now called "Contact Inquiries" (navigation, titles, dashboard cards, messages); form controls in both apps now show a thin 1px cyan focus outline instead of the thick black-and-cyan ring (frontend D61). Details in each folder's `MEMORY.md`. |
| 2026-10-29 | **`admin/`:** the Leads list now shows each lead's email (a mailto link) and lets the team change the status directly in the table. No backend or website change. Details in `admin/MEMORY.md`. |
| 2026-10-29 | **Contact inquiries in the dashboard** (`backend/`, `frontend/`, `admin/`): the website's Contact form now also saves each inquiry in a new backend `crm` module (decision S5); the admin has a Leads list and detail (status, notes) and a dashboard built on real lead counts. The website still sends the team email and now a confirmation to the visitor, from the same Gmail app password; the backend sends nothing. Needs `LEAD_INGEST_KEY` in both `backend/.env` and `frontend/.env`, plus `CRM_API_URL` in `frontend/.env`. Not live until the backend is deployed. Details in each folder's `MEMORY.md`. |
| 2026-10-29 | **Root, `frontend/`, `backend/`, `admin/`:** memory rules clarified. Folder `MEMORY.md` files hold the detailed record of that folder's work; the root `MEMORY.md` is the overview (status per folder, cross-folder items, one change-log line naming the folder). Updated `RULES.md` (section 1), `AGENTS.md`, `CLAUDE.md`, each folder's `CLAUDE.md` and `RULES.md`, and each `MEMORY.md` intro. |
| 2026-10-29 | **Cleanup in `backend/` and `admin/`**: the two auth migrations were squashed into one (never deployed, so safe; after the first deploy, never squash) and an unused admin logo asset was removed. Nothing else in either folder was unused. Details in `backend/MEMORY.md` and `admin/MEMORY.md`. |
| 2026-10-29 | **2FA removed for now** (backend B10, admin AD8): the code step, enrolment screen, guard rule, table and column are gone; employees sign in with email and password only. It is still required by `backend/RULES.md` and must return before production use with real data. |
| 2026-10-29 | **Authentication across backend and admin** (backend B9, admin AD7): Better Auth with cookie sessions, roles and an audit log in a new `core` schema; the admin signs in through its `/api` rewrite. The first administrator is created by `npm run seed:admin` from `SEED_ADMIN_*` in the git-ignored `backend/.env`. Details in `backend/MEMORY.md` and `admin/MEMORY.md`. |
| 2026-10-28 | **Deployed to the VPS** (`159.198.37.158`, `/home/khalidh/awtomatig-v3`): `frontend` → awtomatig.com + www (PM2 `awtomatig-web`, port 3010), `admin` → admin.awtomatig.com (PM2 `awtomatig-admin`, port 3011), both behind Nginx + Certbot. Port 4000 reserved for `backend` (not deployed yet). VPS Node upgraded 20 → 22 (admin needs >= 22). One VPS-only `deploy.sh` at the repo root rebuilds only the changed folders on push to `main`. |
| 2026-10-28 | The website contact form now sends email itself (Next.js Server Action + Gmail SMTP, `frontend/MEMORY.md` D59) as a stopgap until the backend `crm` module is live; move it there then. |
| 2026-10-28 | Added a root `.gitignore` so leftover root build output (`node_modules/`, `.next/`, `.env`, `.codegraph/`) from before the move stops showing as untracked. |
| 2026-10-28 | **Admin scaffolded** in `admin/` (see `admin/MEMORY.md`): Next.js 16, the website's tokens copied with a lint-enforced sync check, shell, dashboard, shared UI primitives, typed client from `backend/openapi.json`, a disabled sign-in and a fail-closed session seam. Nothing committed. |
| 2026-10-28 | **Backend scaffolded** in `backend/` (see `backend/MEMORY.md`): NestJS 11 on Fastify, Drizzle + pg, zod-validated config, single error shape, request ids, health endpoints, OpenAPI export, dependency-cruiser boundary rules, tests. Nothing committed. |
| 2026-10-28 | **`AGENTS.md` and `CLAUDE.md` are now common and live at the root** (repo map, read-first table, working rules; imports the root docs). The old frontend-only content of `frontend/AGENTS.md` moved to `frontend/RULES.md`; `frontend/AGENTS.md` keeps only the `next dev`-managed Next.js notice, and each folder has a thin `CLAUDE.md` loading its own docs. Wrote `admin/DESIGN.md`. |
| 2026-10-28 | Added root `ARCHITECTURE.md`, `RULES.md` and `MEMORY.md`; created `backend/` and `admin/` docs. Split rule: common docs at the root, folder-specific docs in their folder, a `MEMORY.md` in each. |
