# Admin: Memory

Admin app context: status, decisions and why, gotchas, open items and the change log. Read it before starting work in `admin/`, and update it when you decide, ship or resolve something.

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) (decisions AD1 to AD6)
- **Rules:** [RULES.md](RULES.md)
- **Design system:** [DESIGN.md](DESIGN.md)
- **How to run it:** [README.md](README.md)
- **System context:** [../ARCHITECTURE.md](../ARCHITECTURE.md), [../MEMORY.md](../MEMORY.md)

---

## 1. Current status

_Last updated: 2026-10-28_

| Area | Status | Location |
| --- | --- | --- |
| Architecture, rules and design system | Written | this folder |
| Project scaffold (Next 16, Tailwind v4, tokens copied from the website, fonts, lint, Prettier) | ✅ Built; `lint`, `typecheck` and `build` pass | this folder |
| Token sync check against the website | ✅ `scripts/check-tokens-sync.mjs`, part of `npm run lint`; checked with a deliberate mismatch | `scripts/` |
| UI primitives (Button, Card, DataTable, Field/Input, PageHeader, SegmentedLinks, StatusBadge, EmptyState, Skeleton) | ✅ Built | `components/ui/` |
| App shell (sidebar, mobile drawer, topbar, breadcrumb, skip link) | ✅ Built; checked in headless Chrome at 1440 and 500 wide | `components/layout/`, `app/(app)/layout.tsx` |
| Dashboard (KPI cards, bar chart, needs attention, recent activity, date range, empty and loading states) | ✅ Built; real data is empty until modules exist; `/?demo=1` shows labelled sample data in development | `app/(app)/page.tsx`, `components/dashboard/`, `lib/dashboard/` |
| Sign-in screen | ✅ UI and validation only; **disabled**, not wired to the backend | `app/(auth)/login/` |
| Typed API client (browser and server) and generated types | ✅ Built, generated from `backend/openapi.json`; **not yet used by a screen** | `lib/api/` |
| Auth and session | ⏳ Seam only (`lib/auth/session.ts`); fails closed outside development | `lib/auth/` |
| Security headers, CSP, `noindex` | ✅ Checked on a production build with curl | `next.config.ts`, `app/robots.ts` |
| Module screens (CMS, CRM, inventory, accounting, HR) | Not started | `app/(app)/<module>/` |

## 2. Key decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) section 9 (AD1 to AD6). Record new decisions there, and the reasoning that does not fit in a table row here.

## 3. Gotchas

- **Run `npm run typecheck`, not bare `tsc`.** The `*.png` imports get their types from `next-env.d.ts`, which `next typegen` (or `dev` / `build`) generates and git ignores.
- **The production build redirects every page to `/login`**, by design (AD6). To see the app, use `npm run dev` (a development user is signed in).
- **`/?demo=1` is development-only.** `getDashboard` and the page both refuse it elsewhere, and the page shows a "Sample data" badge.
- **Prettier reorders Tailwind classes** (the plugin). Run `npm run format` before `npm run lint`; do not hand-edit class order.
- **Recharts renders after the first measure**, so a screenshot taken too early shows an empty chart card. Wait or use `--virtual-time-budget`.
- **TanStack Table is on v8.** The latest tag (v9) is a different, store-based API.
- **`tanstack/react-table` trips React Compiler's `incompatible-library` lint rule.** The single `eslint-disable` in `DataTable.tsx` is intentional and explained there.
- **`next dev` writes `AGENTS.md`** (the Next.js notice block). Leave it; the file ends with a pointer to the root docs.
- **The website's `Button` lift and glow are not in the admin's `Button`** on purpose (DESIGN.md section 1.1).

## 4. Open items

See ARCHITECTURE.md section 8.

- [ ] Wire sign-in and session to the backend when it has authentication; flip `SIGN_IN_ENABLED`; add sign-out.
- [ ] First module screens (start with CRM leads, the website contact form's destination) and wire the dashboard blocks to real endpoints.
- [ ] Dialog, menu and toast primitives (with the first screen that needs them).
- [ ] CI: `lint`, `typecheck`, `build`, and an `api:generate` freshness check against `backend/openapi.json`.
- [ ] Tests (component and end-to-end for sign-in and one list) once there is behaviour to protect.
- [ ] `status-error-text` token for red text, if needed (DESIGN.md section 11).

## 5. Change log

Newest first.

| Date | Change |
| --- | --- |
| 2026-10-28 | **Admin scaffolded.** Next.js 16 app with the website's tokens copied and a sync check, the shared UI primitives, the app shell (sidebar, drawer, topbar), the dashboard (KPI cards, themed Recharts bar chart, needs-attention list, activity table, empty / loading / error states, development-only sample data), a disabled sign-in form, a typed OpenAPI client, a fail-closed session seam, security headers and `noindex`. Verified: `lint`, `typecheck`, `build`; production redirect to `/login`, headers and robots with curl; dashboard, empty state, login and a 500px-wide view in headless Chrome. |
| 2026-10-28 | Wrote `DESIGN.md` (tokens reused from the website, app shell, data table, forms, charts, the dashboard and a banned-patterns list) and a folder `CLAUDE.md`. |
| 2026-10-28 | Created the folder with `ARCHITECTURE.md`, `RULES.md` and this file. No code yet. |
