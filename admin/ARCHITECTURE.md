# Admin: Architecture

The employee-only UI for the CMS and the ERP modules. It talks only to the backend API. System-wide context is in the root [ARCHITECTURE.md](../ARCHITECTURE.md). Rules are in [RULES.md](RULES.md). Status and history are in [MEMORY.md](MEMORY.md). How to run it is in [README.md](README.md).

Status: **scaffolded, with working sign-in** (shell, dashboard, sign-in, shared components, typed API client, token sync check). No module screens yet.

---

## 1. Role

- Employees log in here to manage website content (CMS) and use the ERP modules (CRM, inventory, accounting, HR).
- It is a separate app from the public site (root decision S2), so it ships on its own schedule and can sit behind a VPN or IP allowlist.
- It never talks to Postgres. Every read and write goes through `backend/` under `/api/v1`.

## 2. Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript `strict` (+ `noUncheckedIndexedAccess`), same as `frontend/` |
| Styling | Tailwind CSS v4 with the website's tokens (copied; see DESIGN.md) |
| API types and client | `openapi-typescript` generates `lib/api/schema.d.ts` from `../backend/openapi.json`; `openapi-fetch` is the typed client |
| Client data | TanStack Query (client components that fetch); Server Components fetch with `serverApi()` |
| Forms | React Hook Form + zod (`@hookform/resolvers`) |
| Tables | TanStack Table v8 (headless) inside our `DataTable` |
| Charts | Recharts, themed to DESIGN.md section 7.9 |
| Icons | `lucide-react` at 1.5 stroke |
| Rendering | A logged-in app: pages are dynamic. The static-site constraints of `frontend/` (static CSP, no auth) do not apply. |

## 3. Structure

```
admin/
  app/
    (auth)/login/    # sign-in (email and password)
    (app)/           # the signed-in shell (layout.tsx), dashboard (page.tsx)
      crm/leads/     # Leads: list (page.tsx, LeadsTable.tsx) and detail ([id]/page.tsx, LeadEditor.tsx)
      <module>/      # one folder per backend module, when its screens exist
  components/
    ui/              # primitives: Button, Card, DataTable, Field, PageHeader, …
    layout/          # Sidebar, MobileNav, Topbar, Breadcrumb
    charts/  dashboard/
  lib/
    api/             # typed client (browser), serverApi() (server), generated schema
    crm/             # lead statuses, labels and the list's URL helpers
    auth/            # session.ts (server: getSession / requireSession / can), client.ts (browser: sign-in, sign-out)
    dashboard/       # types, data, demo (development only)
  scripts/           # check-tokens-sync.mjs
```

One feature folder per backend module, mirroring `backend/src/modules/`. A feature folder owns its screens, its forms and its queries. Shared primitives go in `components/ui/`.

## 4. Requests and the backend

- The browser only talks to this app. `next.config.ts` rewrites `/api/*` to the backend (`API_URL`), so the httpOnly session cookie is same-origin and CORS is not involved. `API_URL` is read at build time: rebuild after changing it. It is **required** and has no default in the code: the app refuses to start or build without it, so the address always comes from `admin/.env` of the place that runs it.
- Server Components call the backend directly through `serverApi()`, which forwards the visitor's cookies.
- The contract is `backend/openapi.json`. After a backend change, run `npm run api:generate` and fix what the compiler reports.

## 5. Auth and permissions

- Session comes from the backend (httpOnly cookie). The admin app holds no tokens in JavaScript-readable storage.
- **Fails closed.** `getSession()` in `lib/auth/session.ts` calls `GET /api/v1/auth/session` with the visitor's cookie. No session, or a backend that cannot be reached, means signed out. There is no development bypass: sign in with a real (seeded) account.
- Pages are protected twice: `proxy.ts` (Next 16's rename of `middleware`) redirects a request with no session cookie to `/login?next=…` (an optimistic check that only looks for the cookie), and the `(app)` layout calls `requireSession()`, which validates the session with the backend. Layouts do not re-run on client navigation, so data fetches rely on the backend's 401 (every API call is checked there). `?next=` accepts local paths only (`safeNextPath`).
- Sign-in and sign-out are plain `fetch` calls in `lib/auth/client.ts` to `/api/v1/auth/*` (Better Auth's endpoints, which are not in `openapi.json`); backend error codes become user messages in that one file.
- The UI hides what a user may not do based on the permissions the backend returns (`module.resource.action`, helper `can()`). This is convenience only: the backend always enforces them.

## 6. Security

- Production CSP is `'self'` only (plus the inline scripts Next.js needs), with `frame-ancestors 'none'`, no third parties. Headers also set `X-Frame-Options: DENY`, `nosniff`, a same-origin referrer policy and `X-Robots-Tag: noindex, nofollow`; `robots.ts` disallows everything and the metadata is `noindex`.
- Nothing in `NEXT_PUBLIC_*` is secret (only the timezone).

## 7. Design system

**Decided: [DESIGN.md](DESIGN.md).** The admin reuses the website's tokens (colors, Inter / Inter Tight, 1px spacing unit, radii, easing), copied into `app/globals.css` rather than imported. `npm run lint` runs `scripts/check-tokens-sync.mjs`, which fails if a shared token or text style differs from `frontend/`. It drops the website's atmosphere (gradients, glass, glow) and adds dense patterns: app shell, data table, forms and the dashboard.

## 8. Open items

- [x] ~~Wire sign-in, session and sign-out to the backend~~ (AD7).
- [ ] A change-password / security screen (the backend endpoint exists), and handling an expired session mid-use (today a 401 sends the next navigation to `/login`).
- [ ] Network access: public (with 2FA once it is back), or VPN / IP allowlist (root open item).
- [ ] Host: `admin.awtomatig.com` or a path.
- [ ] Dialog, menu and toast primitives, added with the first screen that needs them.
- [ ] Command search (⌘K) in the topbar, when there is something to search.

## 9. Decision log

Newest last. Supersede, never rewrite.

| # | Date | Decision | Why |
| --- | --- | --- | --- |
| AD1 | 2026-10-28 | A separate `admin/` app (root S2) | Isolates the ERP UI from the public site's deploys, CSP and static rendering. |
| AD2 | 2026-10-28 | All data through the backend API; types generated from OpenAPI | One place enforces permissions and writes the audit log. |
| AD3 | 2026-10-28 | The admin reuses the website's design tokens (copied, with a sync check), light content area with a charcoal sidebar, no decorative effects | One brand across both apps; a quiet, minimal, professional tool. Details in [DESIGN.md](DESIGN.md). |
| AD4 | 2026-10-28 | Stack confirmed: Next 16, TanStack Query and Table v8, React Hook Form + zod, Recharts, Lucide, openapi-typescript + openapi-fetch | Matches the proposal. TanStack Table is pinned to v8 (v9 is a new, store-based API). |
| AD5 | 2026-10-28 | The browser calls `/api/*` on the admin origin, rewritten to the backend | Same-origin httpOnly cookie, no CORS. |
| AD6 | 2026-10-28 | The admin fails closed: no session outside development, sign-in disabled until backend auth exists | An unauthenticated ERP shell must never be reachable in production, even though it holds no data yet. |
| AD7 | 2026-10-29 | Sign-in uses the backend's Better Auth endpoints through the `/api` rewrite; no development bypass; hand-written `fetch` calls instead of the Better Auth client package | Same-origin httpOnly cookie, no token in JavaScript. Two endpoints do not justify another dependency. |
| AD8 | 2026-10-29 | 2FA screens removed for now (follows backend B10) | The backend no longer requires 2FA. When it returns, add a code step to the sign-in form and a forced enrolment screen; `qrcode` was the library used to draw the QR code. |
| AD9 | 2026-10-29 | The first module screens are the CRM Leads list and detail, and the dashboard is fed by `GET /crm/leads/stats` | It is the first real data. Server Components fetch with `serverApi()`; only the status and notes form is a client component and uses the typed browser client. Filters, sorting and paging are in the URL. `Select` and `Textarea` joined the form primitives. |
