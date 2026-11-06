# Admin: Architecture

The employee-only UI for the CMS and the ERP modules. It talks only to the backend API. System-wide context is in the root [ARCHITECTURE.md](../ARCHITECTURE.md). Rules are in [RULES.md](RULES.md). Status and history are in [MEMORY.md](MEMORY.md). How to run it is in [README.md](README.md).

Status: **scaffolded, with working sign-in** (shell, dashboard, sign-in, shared components, typed API client, token sync check) and module screens: CRM Contact Inquiries, Recruitment Job Openings.

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
      recruitment/jobs/  # Job Openings: list, new/, JobForm.tsx (create and edit), [id]/ (tabs, JobActions, applications table), [id]/applications/[applicationId]/ (applicant page)
      analytics/google/  # Google Analytics report (page.tsx, RankTable.tsx)
      cms/case-studies/, cms/testimonials/, cms/faqs/  # Website content: list, new/, the form, [id]/ (details, image or logo panel, actions)
      <module>/      # one folder per backend module, when its screens exist
  components/
    ui/              # primitives: Button, Card, DataTable, Field, PageHeader, …
    layout/          # Sidebar, MobileNav, Topbar, Breadcrumb
    cms/             # ImagePicker (photo or logo preview) and MoveButtons, shared by case studies and testimonials
    charts/  dashboard/
  lib/
    api/             # typed client (browser), serverApi() (server), generated schema
    crm/             # lead statuses, labels and the list's URL helpers
    cms/             # case-studies.ts, testimonials.ts (types, labels, URL helpers), *-form.ts (checks and request bodies), image.ts (uploads), reorder.ts (move up / down)
    recruitment/     # jobs.ts, applications.ts (types, labels, URL helpers), job-form.ts (form checks and request bodies)
    analytics/       # ga.ts (server: Google Analytics Data API, cached), types.ts, format.ts
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
- [x] ~~Dialog primitive~~ (AD10). Menu and toast primitives are still to come, with the first screen that needs them.
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
| AD10 | 2026-11-02 | The recruitment screens follow the CRM pattern (Server Components fetch with `serverApi()`; client components only for mutations through the typed browser client), with three additions: React Hook Form + zod for the long opening form, a native `<dialog>` `Dialog` primitive for confirmations, and shared `SortHeader` and `Pagination` primitives that the CRM list now uses too | The form has repeating question rows and many fields, which is what React Hook Form is for; native `<dialog>` gives focus trapping, Esc and focus return without a dependency; a third copy of the sort header and the paging footer would have been the moment to share them. Filters, sort, paging and the opening's tab are in the URL. Client checks are feedback only; the backend's field messages are shown next to their fields through `lib/api/errors.ts`. No new dependency. |
| AD11 | 2026-11-04 | The Case Studies screens (Website → Case Studies) follow the AD10 pattern, and the image is shown straight from the public bucket: `ASSETS_URL` (the backend's `R2_PUBLIC_BASE_URL`) is required to build and start for production and is the one third-party origin added to the CSP `img-src` | Case study images are public files on `awtomatig-public`, so the browser loads them directly; without the origin in the CSP every preview would be blocked, which looks like a bug in the screen. Like `API_URL` it is read at build time and has no default. `next dev` and `typegen` do not need it. No new dependency. |
| AD12 | 2026-11-05 | The Testimonials screens (Website → Testimonials) follow AD10 and AD11. `ImagePicker` and `MoveButtons` moved to `components/cms/` and became generic: the picker has a `logo` variant (white card, padding, optional black preview) and takes its hint and noun; move buttons take a `move` function from `lib/cms/reorder.ts` instead of calling one endpoint. A testimonial's logo has its own card on the edit page (replace, remove, "show in black"), and the client's agreement is a checkbox on the form | The second use of the same image and reorder code is the moment to share it instead of copying a primitive into a feature (RULES.md section 3). The logo preview must look like the website's white card, or a white logo would look missing. The agreement sentence is recorded exactly as the plan words it, and a live testimonial shows it as text, because the backend refuses to withdraw it while published. No new dependency, no new environment variable (logos come from the same `ASSETS_URL` origin). |
| AD13 | 2026-11-05 | **Website → Site Metrics** (`/cms/site-metrics`) is one page of two small tables (Statistics, Ratings) with columns Field, Value, Shown on (page chips), Last updated and an Edit button. Edit opens a dialog with the field title, the value input with the backend's format hint, the full list of pages and sections where the figure appears (each with an Open link to the live page) and a note when the figure is shared ("changing it updates 3 places"). Saving says it is live at once. The page names and sections come from the backend's catalog, never hard-coded here. Permissions `cms.metric.read` / `cms.metric.update`. | You asked for the field title and the presented pages to be shown while editing. Reading them from the API keeps this app free of knowledge about the website. |
| AD14 | 2026-11-05 | **Analytics → Google Analytics** (`/analytics/google`) reads Google Analytics 4 **directly from the admin's server** with Google's `@google-analytics/data` client and a read-only service account (`GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY` in `admin/.env`, server-only), not through the backend. It shows six headline figures against the previous period, sessions per day, top pages, traffic sources and countries for 7 / 30 / 90 days (`?range=`). Results are cached in memory for five minutes per range, the last good data is served if Google fails, and a missing setting or a Google error shows a plain message. Any signed-in employee can open it (there is no analytics permission in the backend yet). | Owner's decision: the integration lives only in the admin. It is an exception to "all data goes through the backend" (RULES.md section 1) because GA is a third party, not our data: nothing is stored, no database is touched, and the key stays on the server. If more consumers of GA appear, or access needs a role, move it into a backend `analytics` module. One new dependency (`@google-analytics/data`), at the owner's request ("through the Google SDK"). |
| AD15 | 2026-11-05 | **Website → FAQs** (`/cms/faqs`) manages the website's one shared FAQ list, built like Testimonials (AD12) with the same shared table, move buttons and dialogs: a list (search on question or answer, status filter, sort by order, question or date, paging, move up / down when unfiltered), a form with two fields (question up to 200 characters, plain-text answer up to 1,000, both with a live character count), Save draft or Publish on a new FAQ, Save changes on an existing one, and Publish / Unpublish / Delete behind confirmation dialogs. **Delete is offered in every state** (the dialog says when the FAQ is live and will leave the website); this differs from case studies and testimonials, which are drafts-only. The pages that show the list are one plain constant, `FAQ_PAGES` in `lib/cms/faqs.ts` ("Contact"), used in the screen's notes and dialogs; update it when the shared FAQ section is placed on another page. Permissions `cms.faq.read` / `.create` / `.update` / `.delete`. | The backend list has no page column by design (one list for every page), so the admin cannot discover where the list shows; a single constant is the honest, cheap record, and it is the one thing to change when the section is placed on Home. No new dependency or environment variable. |
| AD16 | 2026-11-06 | **HR → Employees and Departments** (`/hr/employees`, `/hr/departments`) follow AD10 to AD12. The employee **profile is the centre**: details, the career timeline (newest first, one block per stint, Scheduled and Left markers) and a documents card. Every employment change goes through one **Update employment** dialog (pre-filled, with a plain summary of what changes; Save stays disabled until something differs), which also serves **Add past record**; a wrong record is removed with a confirmation, never edited. **Mark as left** lists the direct reports and asks who takes over. Salary and the full NID show only with `hr.sensitive.read` (the API already omits them; the screen just does not offer them). Documents open through the backend's 5-minute signed link in a new tab. Permissions `hr.employee.read` / `.create` / `.update` / `.delete`, `hr.department.read` / `.manage`, `hr.document.read` / `.manage`, `hr.sensitive.read`. New primitives `ConfirmDialog` and `InlineError`. | The profile holds all of an employee's history on one page, as the plan asked; one dialog for every change keeps the timeline the only source of truth (backend B20). No new dependency or environment variable. |
