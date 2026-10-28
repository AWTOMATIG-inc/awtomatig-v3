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
| Backend API (CMS + ERP modules) | `backend/` | The admin app, plus the website's contact form | Not started |
| Internal admin / ERP UI | `admin/` | Employees only | Not started |

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
- [ ] Network access for `admin` (public with 2FA, or VPN / IP allowlist).
- [ ] Module order and ownership for the ERP.

## 6. Decision log

Newest last. Add a row per decision; supersede, never rewrite. Folder-specific decisions go in that folder's ARCHITECTURE.md or MEMORY.md.

| # | Date | Decision | Why |
| --- | --- | --- | --- |
| S1 | 2026-10-28 | The ERP is internal only, single tenant | Used by the company and its employees. No `tenant_id`. Revisit only if it is ever offered to clients. |
| S2 | 2026-10-28 | Three folders in one repo: `frontend/`, `backend/`, `admin/` | The marketing site stays small, static and fast; the ERP UI will grow large. Separate deploys, separate auth surfaces, and the admin app can sit behind a VPN without touching the public site. |
| S3 | 2026-10-28 | The OpenAPI spec is the contract between folders | Separately deployed apps must not share source. Types are generated, never hand-copied. |
| S4 | 2026-10-28 | Common docs at the root, folder-specific docs in the folder, a `MEMORY.md` in every folder | Keeps each folder self-contained for people and AI agents, with one place for cross-cutting decisions. |
