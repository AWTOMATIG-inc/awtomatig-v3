# Admin: Memory

The detailed record of the work done in `admin/`: status, decisions and why, gotchas, open items and the dated change log (what changed, what was verified). Read it before starting work, and update it when you decide, build, fix, clean up or resolve something. The one-line overview of each change goes in the root [MEMORY.md](../MEMORY.md).

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) (decisions AD1 to AD9)
- **Rules:** [RULES.md](RULES.md)
- **Design system:** [DESIGN.md](DESIGN.md)
- **How to run it:** [README.md](README.md)
- **System context:** [../ARCHITECTURE.md](../ARCHITECTURE.md), [../MEMORY.md](../MEMORY.md)

---

## 1. Current status

_Last updated: 2026-10-29_

| Area | Status | Location |
| --- | --- | --- |
| Architecture, rules and design system | Written | this folder |
| Project scaffold (Next 16, Tailwind v4, tokens copied from the website, fonts, lint, Prettier) | ✅ Built; `lint`, `typecheck` and `build` pass | this folder |
| Token sync check against the website | ✅ `scripts/check-tokens-sync.mjs`, part of `npm run lint`; checked with a deliberate mismatch | `scripts/` |
| UI primitives (Button, Card, DataTable, Field/Input, PageHeader, SegmentedLinks, StatusBadge, EmptyState, Skeleton) | ✅ Built | `components/ui/` |
| App shell (sidebar, mobile drawer, topbar, breadcrumb, skip link) | ✅ Built; checked in headless Chrome at 1440 and 500 wide | `components/layout/`, `app/(app)/layout.tsx` |
| Dashboard (KPI cards, bar chart, needs attention, recent activity, date range, empty and loading states) | ✅ Built; real data is empty until modules exist; `/?demo=1` shows labelled sample data in development | `app/(app)/page.tsx`, `components/dashboard/`, `lib/dashboard/` |
| Sign-in screen (email and password with a show / hide eye button, `?next=` return) | ✅ Wired to the backend; checked in headless Chrome and with a scripted browser-like run through :3001 | `app/(auth)/login/` |
| Sign-out | ✅ Button in the sidebar user block | `components/layout/SidebarContent.tsx` |
| Typed API client (browser and server) and generated types | ✅ Built, generated from `backend/openapi.json`; **not yet used by a screen** | `lib/api/` |
| Auth and session | ✅ `getSession` calls the backend; `requireSession` sends signed-out users to /login; `proxy.ts` redirects when there is no cookie. 2FA is removed for now (AD8) | `lib/auth/`, `proxy.ts` |
| Security headers, CSP, `noindex` | ✅ Checked on a production build with curl | `next.config.ts`, `app/robots.ts` |
| **CRM → Contact Inquiries** (route `/crm/leads`): list (search, status filter, sort, paging) with each lead's **email as a mailto link** and the **status changeable in the row**, lead detail with the message and details, status and notes editing (`crm.lead.update`) | ✅ Built; checked in headless Chrome at 1440 and 500 wide against sample leads, and the save through the `/api` rewrite with curl | `app/(app)/crm/leads/`, `lib/crm/` |
| Dashboard figures | ✅ Real: leads needing a reply, inquiries in the range (with the previous period), open leads, a bar chart per day or week, "Needs attention" for leads waiting over 2 days, recent activity | `lib/dashboard/data.ts` |
| Module screens (CMS, inventory, accounting, HR) | Not started | `app/(app)/<module>/` |

## 2. Key decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) section 9 (AD1 to AD6). Record new decisions there, and the reasoning that does not fit in a table row here.

## 3. Gotchas

- **Run `npm run typecheck`, not bare `tsc`.** The `*.png` imports get their types from `next-env.d.ts`, which `next typegen` (or `dev` / `build`) generates and git ignores.
- **There is no development user any more.** Run the backend (`npm run start:dev`) with a migrated database and a seeded administrator, then sign in. With the backend down every page redirects to `/login`.
- **`proxy.ts` only checks that the session cookie exists** (`awtomatig.session_token`, or `__Secure-awtomatig.session_token` over HTTPS). A stale cookie passes it and is rejected by `requireSession()`.
- **Use `router.replace` + `router.refresh()` after sign-in and sign-out**, not `window.location` (the lint rule forbids it; dynamic pages are not cached client-side).
- **`/?demo=1` is development-only.** `getDashboard` and the page both refuse it elsewhere, and the page shows a "Sample data" badge.
- **Prettier reorders Tailwind classes** (the plugin). Run `npm run format` before `npm run lint`; do not hand-edit class order.
- **Recharts renders after the first measure**, so a screenshot taken too early shows an empty chart card. Wait or use `--virtual-time-budget`.
- **TanStack Table is on v8.** The latest tag (v9) is a different, store-based API.
- **`tanstack/react-table` trips React Compiler's `incompatible-library` lint rule.** The single `eslint-disable` in `DataTable.tsx` is intentional and explained there.
- **`next dev` writes `AGENTS.md`** (the Next.js notice block). Leave it; the file ends with a pointer to the root docs.
- **The website's `Button` lift and glow are not in the admin's `Button`** on purpose (DESIGN.md section 1.1).

## 4. Open items

See ARCHITECTURE.md section 8.

- [ ] Put 2FA back (AD8) when the backend does: a code step at sign-in and a forced enrolment screen with a QR code.
- [ ] Change-password / security screen; expired-session handling mid-use; "forgot password" once the backend can send email.
- [x] ~~First module screens (CRM leads) and real dashboard blocks~~ (AD9). Still demo-only: nothing; the quotes, invoices and stock cards return when those modules exist.
- [ ] Leads: per-lead activity card (the detail page has none yet, DESIGN.md 8.3), assigning a lead, delete, CSV export, an empty-state check with many leads.
- [ ] Dialog, menu and toast primitives (with the first screen that needs them).
- [ ] CI: `lint`, `typecheck`, `build`, and an `api:generate` freshness check against `backend/openapi.json`.
- [ ] Tests (component and end-to-end for sign-in and one list) once there is behaviour to protect.
- [ ] `status-error-text` token for red text, if needed (DESIGN.md section 11).

## 5. Change log

Newest first.

| Date | Change |
| --- | --- |
| 2026-10-29 | **`API_URL` is required, no hardcoded fallback.** Removed `?? "http://127.0.0.1:4000"` from `next.config.ts` and `lib/api/server.ts`: the build, `next dev` and `serverApi()` now throw a clear error when `API_URL` is not set, so the backend's address always comes from `admin/.env` (the VPS sets its own). `.env.example`, `README.md` and `ARCHITECTURE.md` say so. **The VPS `admin/.env` must contain `API_URL=http://127.0.0.1:4000` before the next build, or the build fails.** |
| 2026-10-29 | **No focus styling on form fields, and a show / hide password button.** `app/globals.css` now removes the focus outline from inputs, selects and textareas (same as the website, frontend D62); checkboxes and radios keep a keyboard-only thin cyan outline. New `PasswordInput` primitive (eye / eye-off button inside the field, `aria-label` and `aria-pressed`, starts hidden) used by the sign-in form; `DESIGN.md` updated. Verified in headless Chrome: the field type flips between `password` and `text` with the value kept, the typed text clears the button (44px padding), and a focused field has no outline, shadow or border change. `typecheck`, `lint` pass. |
| 2026-10-29 | **"Leads" renamed "Contact Inquiries" in the UI, and thin cyan focus on form controls.** The sidebar entry (and so the breadcrumb), the list's title and tab title, the lead page's back link and titles, the dashboard cards ("Inquiries needing a reply", "Open inquiries"), the chart unit and the empty and error messages now say inquiries. Routes, code names and the `crm.lead.*` permissions are unchanged. `app/globals.css` now gives inputs, selects and textareas a 1px cyan outline and checkboxes and radios the same outline 2px out, instead of the two-tone ring (same as the website, frontend D61; buttons and links keep the ring). `DESIGN.md` updated. Verified: `typecheck`, `lint`; focus states of the search box and the status select in headless Chrome. |
| 2026-10-29 | **Leads list: email column and status change in the row.** Added an Email column (a `mailto:` link, so one click starts a reply) and replaced the status badge with `LeadStatusSelect`, a compact dropdown that saves on change through the typed client, restores the old value and shows "Not saved" if it fails, and falls back to a plain badge without `crm.lead.update`. Dropped the Budget column from the list to make room (it is still on the lead's page). `Select` gained a `compact` variant. Verified: `typecheck`, `lint`; in headless Chrome the dropdown was changed like a user would and the database and audit log showed the change; screenshot checked. |
| 2026-10-29 | **Leads and a real dashboard (AD9).** Regenerated the API types. New `Select` and `Textarea` primitives, a **CRM → Leads** sidebar entry, the Leads list (GET-form search and status filter, sortable Name / Status / Received, 20 per page, Previous / Next, redirect from a page past the end) and lead detail (message, details, `LeadEditor` for status and notes, read-only without `crm.lead.update`). `lib/dashboard/data.ts` now calls `/crm/leads/stats` with the app's time zone and fills the KPIs, the chart, "Needs attention" and "Recent activity" (demo data still works with `?demo=1`). Verified: `typecheck`, `lint`, `build`; screenshots at 1440 and 500 wide (fixed a squeezed toolbar: spacing here is 1px per unit, so `w-48` is 48px); a status and notes save through the `/api` rewrite. Sample leads used for the checks were deleted. |
| 2026-10-29 | **Cleanup of files not needed to run or deploy.** Removed the unreferenced `public/images/awtomatig-logo.png` (the app uses `awtomatig-full-logo.png` and `awtomatig-full-logo-dark.png`). Audited components, `lib/` and dependencies: everything else is used (`react-dom` and `server-only` are required by Next.js and the server-only imports). Git-ignored output (`.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`) is regenerated and was left alone. `lint`, `typecheck` and `build` pass. |
| 2026-10-29 | **2FA removed for now (AD8).** Deleted `/two-factor/setup`, the code step of the login form, the 2FA functions of `lib/auth/client.ts`, `twoFactorEnabled` from the session, and the `qrcode` dependency; regenerated the API types. Verified: `typecheck`, `lint`, `build`, and a live sign-in, dashboard and sign-out through :3001. |
| 2026-10-29 | **Sign-in wired to the backend (AD7).** `lib/auth/client.ts` (sign-in, sign-out, `safeNextPath`); `getSession` / `requireSession` now call `GET /api/v1/auth/session` (development user and `SIGN_IN_ENABLED` removed); `proxy.ts`; sign-out in the sidebar; regenerated API types. (It first shipped with forced 2FA enrolment, removed the same day.) |
| 2026-10-28 | **Admin scaffolded.** Next.js 16 app with the website's tokens copied and a sync check, the shared UI primitives, the app shell (sidebar, drawer, topbar), the dashboard (KPI cards, themed Recharts bar chart, needs-attention list, activity table, empty / loading / error states, development-only sample data), a disabled sign-in form, a typed OpenAPI client, a fail-closed session seam, security headers and `noindex`. Verified: `lint`, `typecheck`, `build`; production redirect to `/login`, headers and robots with curl; dashboard, empty state, login and a 500px-wide view in headless Chrome. |
| 2026-10-28 | Wrote `DESIGN.md` (tokens reused from the website, app shell, data table, forms, charts, the dashboard and a banned-patterns list) and a folder `CLAUDE.md`. |
| 2026-10-28 | Created the folder with `ARCHITECTURE.md`, `RULES.md` and this file. No code yet. |
