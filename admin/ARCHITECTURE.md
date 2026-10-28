# Admin: Architecture

The employee-only UI for the CMS and the ERP modules. It talks only to the backend API. System-wide context is in the root [ARCHITECTURE.md](../ARCHITECTURE.md). Rules are in [RULES.md](RULES.md). Status and history are in [MEMORY.md](MEMORY.md). How to run it is in [README.md](README.md).

Status: **scaffolded** (shell, dashboard, sign-in form, shared components, typed API client, token sync check). No module screens yet, and sign-in is not wired because the backend has no authentication module.

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
    (auth)/login/    # sign-in
    (app)/           # the signed-in shell (layout.tsx), dashboard (page.tsx)
      <module>/      # one folder per backend module, when its screens exist
  components/
    ui/              # primitives: Button, Card, DataTable, Field, PageHeader, …
    layout/          # Sidebar, MobileNav, Topbar, Breadcrumb
    charts/  dashboard/
  lib/
    api/             # typed client (browser), serverApi() (server), generated schema
    auth/            # getSession / requireSession / can
    dashboard/       # types, data, demo (development only)
  scripts/           # check-tokens-sync.mjs
```

One feature folder per backend module, mirroring `backend/src/modules/`. A feature folder owns its screens, its forms and its queries. Shared primitives go in `components/ui/`.

## 4. Requests and the backend

- The browser only talks to this app. `next.config.ts` rewrites `/api/*` to the backend (`API_URL`), so the httpOnly session cookie is same-origin and CORS is not involved. `API_URL` is read at build time: rebuild after changing it.
- Server Components call the backend directly through `serverApi()`, which forwards the visitor's cookies.
- The contract is `backend/openapi.json`. After a backend change, run `npm run api:generate` and fix what the compiler reports.

## 5. Auth and permissions

- Session comes from the backend (httpOnly cookie). The admin app holds no tokens in JavaScript-readable storage.
- **Fails closed.** `lib/auth/session.ts` is the one seam. Until the backend has authentication, development gets a fixed development user and every other environment gets no session: all pages redirect to `/login`, whose form is disabled with an explanation. When the backend ships auth, replace the body of `getSession()` with a call to its session endpoint; callers do not change.
- Pages are protected in the `(app)` layout with `requireSession()`. Layouts do not re-run on client navigation, so once real auth exists also check in each data fetch and add a `proxy.ts` optimistic redirect (Next 16 renamed `middleware` to `proxy`).
- The UI hides what a user may not do based on the permissions the backend returns (`module.resource.action`, helper `can()`). This is convenience only: the backend always enforces them.

## 6. Security

- Production CSP is `'self'` only (plus the inline scripts Next.js needs), with `frame-ancestors 'none'`, no third parties. Headers also set `X-Frame-Options: DENY`, `nosniff`, a same-origin referrer policy and `X-Robots-Tag: noindex, nofollow`; `robots.ts` disallows everything and the metadata is `noindex`.
- Nothing in `NEXT_PUBLIC_*` is secret (only the timezone).

## 7. Design system

**Decided: [DESIGN.md](DESIGN.md).** The admin reuses the website's tokens (colors, Inter / Inter Tight, 1px spacing unit, radii, easing), copied into `app/globals.css` rather than imported. `npm run lint` runs `scripts/check-tokens-sync.mjs`, which fails if a shared token or text style differs from `frontend/`. It drops the website's atmosphere (gradients, glass, glow) and adds dense patterns: app shell, data table, forms and the dashboard.

## 8. Open items

- [ ] Wire sign-in, session and sign-out to the backend once its authentication module exists; flip `SIGN_IN_ENABLED`.
- [ ] Network access: public with 2FA, or VPN / IP allowlist (root open item).
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
