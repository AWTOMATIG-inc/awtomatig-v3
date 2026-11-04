# AWTOMATIG: System Architecture

The system-wide view: what the parts are, how they connect and how they ship. Each folder keeps its own detail:

| Folder | Architecture | Rules | Memory | Design |
| --- | --- | --- | --- | --- |
| Repo root (this file) | this file | [RULES.md](RULES.md) | [MEMORY.md](MEMORY.md) | |
| `frontend/` | (this file) | [RULES.md](frontend/RULES.md) | [MEMORY.md](frontend/MEMORY.md) | [DESIGN.md](frontend/DESIGN.md) |
| `backend/` | [ARCHITECTURE.md](backend/ARCHITECTURE.md) | [RULES.md](backend/RULES.md) | [MEMORY.md](backend/MEMORY.md) | |
| `admin/` | [ARCHITECTURE.md](admin/ARCHITECTURE.md) | [RULES.md](admin/RULES.md) | [MEMORY.md](admin/MEMORY.md) | [DESIGN.md](admin/DESIGN.md) |

Put a document at the root only if it applies to more than one folder. Anything about one folder lives in that folder. The agent entry points [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) are common and live at the root; each folder's `CLAUDE.md` only loads that folder's own docs.

---

## 1. Scope

| Part | Folder | Audience | State |
| --- | --- | --- | --- |
| Marketing website | `frontend/` | Public | Built (Next.js 16) |
| Backend API (CMS + ERP modules) | `backend/` | The admin app, plus the website's contact form and careers pages | Live: auth, `crm`, `recruitment`; no CMS or ERP module yet |
| Internal admin / ERP UI | `admin/` | Employees only | Live: sign-in, dashboard, Contact Inquiries, Recruitment |

The ERP is **internal only**: used by the company and its employees, not sold to clients. That means a **single tenant** (no `tenant_id` columns) and a known, small user base.

## 2. System overview

```
Browser (public) ──► Nginx ──► frontend (Next.js, mostly static)
                                   │  contact form, CMS content (public, read-only)
                                   ▼
Browser (employees) ─► Nginx ─► admin (Next.js) ──► backend API
                                                       │
                                      ┌────────────────┼────────────────┐
                                      ▼                ▼                ▼
                                 PostgreSQL      S3-compatible     pg-boss jobs
                                 (own VPS)       object storage    (inside Postgres)
```

- One VPS deployment: PM2 + Nginx + HTTPS, as for the website.
- `frontend` and `admin` never talk to the database. Only `backend` does.
- Postgres and the backend are never exposed directly; only Nginx faces the internet.
- The public site calls the backend for the contact form and, later, read-only CMS content. Everything else requires an employee session.

## 3. Repository layout

One git repository, three independent packages, each with its own `package.json`, lockfile, CI job and deploy:

```
/
├── ARCHITECTURE.md  RULES.md  MEMORY.md  README.md   # common
├── frontend/   # public website
├── backend/    # API (modular monolith)
└── admin/      # employee UI
```

- **No cross-imports between folders.** The contract between them is the backend's OpenAPI spec. `admin` and `frontend` generate their API types from it.
- Share nothing by copying code between folders, except the design tokens (see `admin/ARCHITECTURE.md`).
- Introduce npm workspaces only if real shared code appears.

## 4. Delivery

- **CI (per package):** type-check, lint, tests, build. The backend job also applies migrations to a throwaway Postgres and runs the module-boundary check.
- **Deploy:** PM2, Nginx, Certbot and a webhook deploy for each app, like the website today. Backend migrations run before the new version starts and must be compatible with the previous app version.
- **Environments:** local, staging and production. Production data never goes to a laptop unmasked.
- **Ordering:** a breaking API change is released as a new API version, so `frontend` and `admin` can deploy on their own schedule.

## 5. Open items (system level)

- [ ] Error tracking and uptime monitoring tooling.
- [ ] Network access for `admin` (public, ideally with 2FA once it is back, or VPN / IP allowlist).
- [ ] Module order and ownership for the ERP.

## 6. Decision log

Newest last. Add a row per decision; supersede, never rewrite. Folder-specific decisions go in that folder's ARCHITECTURE.md or MEMORY.md.

| # | Date | Decision | Why |
| --- | --- | --- | --- |
| S1 | 2026-10-28 | The ERP is internal only, single tenant | Used by the company and its employees. No `tenant_id`. Revisit only if it is ever offered to clients. |
| S2 | 2026-10-28 | Three folders in one repo: `frontend/`, `backend/`, `admin/` | The marketing site stays small, static and fast; the ERP UI will grow large. Separate deploys, separate auth surfaces, and the admin app can sit behind a VPN without touching the public site. |
| S3 | 2026-10-28 | The OpenAPI spec is the contract between folders | Separately deployed apps must not share source. Types are generated, never hand-copied. |
| S4 | 2026-10-28 | Common docs at the root, folder-specific docs in the folder, a `MEMORY.md` in every folder | Keeps each folder self-contained for people and AI agents, with one place for cross-cutting decisions. |
| S5 | 2026-10-29 | Website inquiries reach the CRM through the website's Server Action, server to server, with a shared key; the website keeps sending the emails | The browser never calls the backend (no CORS, no CSP change). The backend stays a store, so the working email setup (Gmail app password in `frontend/.env`) is untouched. If the backend is down the team is still emailed, so no inquiry is lost. Details in `backend/src/modules/crm/README.md`, frontend D60 and admin AD9. |
| S6 | 2026-11-02 | Recruitment follows S5: candidates apply through the website's Server Action, server to server with the shared key; the backend stores the application, and the resume goes to the private Cloudflare R2 bucket (`career/<job title>/<file name>.pdf`, never replacing a file) and is opened only through a 5-minute signed link; the website sends the candidate's confirmation email | Same reasons as S5: no browser-to-backend traffic, no CSP change, the Gmail app password stays in the website. R2 keeps files out of Postgres and off the VPS disk. Plan and phases in `RECRUITMENT_PLAN.md`; details in backend B12 to B15, frontend D63 and admin AD10. |
| S7 | 2026-11-04 | The website reads published case studies from the backend's public `cms` endpoint, server to server with `CRM_API_URL` (no key: published content is public); images are public files on the R2 bucket `awtomatig-public`, shown through `next/image` from the host in `ASSETS_URL` | Same shape as careers (S5, S6): the browser never calls the backend. Pages refresh every 60 seconds, so publish and unpublish reach the site without a deploy; the last good list is kept if the backend is down. After a change that affects the live site the backend also calls the website's `/api/revalidate` (server to server, same shared key, optional `WEBSITE_URL`) so it shows at once. Plan in `CASE_STUDY_PLAN.md`; details in backend B16 and frontend D65. |
