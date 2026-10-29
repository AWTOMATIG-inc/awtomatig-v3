# AWTOMATIG Admin

The internal CMS and ERP UI for employees. Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4. It talks only to the backend API.

Read [ARCHITECTURE.md](ARCHITECTURE.md), [RULES.md](RULES.md) and [DESIGN.md](DESIGN.md) before changing anything. Status and decisions are in [MEMORY.md](MEMORY.md).

## Getting started

```bash
cp .env.example .env     # API_URL (required, no default) and NEXT_PUBLIC_TIMEZONE
npm install
npm run dev              # http://localhost:3001
```

Start the backend first (in `backend/`: migrate, `npm run seed:admin`, `npm run start:dev`), then sign in with the seeded administrator on http://localhost:3001. With the backend down every page redirects to `/login` (the admin fails closed). After signing in, `/?demo=1` shows the dashboard with clearly labelled sample data (development only).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Dev server (port 3001), production build, production server (port set by PM2 on the VPS). |
| `npm run typecheck` | `next typegen`, then `tsc --noEmit`. |
| `npm run lint` | ESLint, the token sync check against the website, then Prettier. CI runs this. |
| `npm run format` | Prettier (sorts Tailwind classes). Run it after writing code. |
| `npm run api:generate` | Regenerate `lib/api/schema.d.ts` from `../backend/openapi.json`. Run it after the backend contract changes. |

## Layout

```
app/
  layout.tsx  globals.css  robots.ts  not-found.tsx
  (auth)/login/          sign-in
  (app)/                 the signed-in shell: layout.tsx (sidebar, topbar), page.tsx (dashboard), loading, error
    crm/leads/           Leads list and lead detail (CRM)
components/
  ui/                    Button, Card, DataTable, Field/Input, PageHeader, SegmentedLinks, StatusBadge, EmptyState, Skeleton
  layout/                Sidebar, MobileNav (drawer), Topbar, Breadcrumb
  charts/                BarChart (Recharts, themed), ChartCard
  dashboard/             KpiCard, AttentionCard, ActivityTable
lib/
  api/                   typed client (browser) and serverApi() (server), generated schema
  auth/                  session.ts (getSession / requireSession / can) and client.ts (sign-in, sign-out)
  dashboard/             types, data (real; empty until modules exist), demo (development only)
  nav.ts  format.ts  config.ts  cn.ts
scripts/check-tokens-sync.mjs   fails when a shared token differs from the website
```

## Adding a module's screens

1. Add a folder under `app/(app)/<module>/` with its pages, and a matching feature folder for its components.
2. Add the screen to `lib/nav.ts` (only when it exists), and gate it on a permission once the backend returns permissions.
3. Use `PageHeader`, one `primary` button, and `DataTable` inside a `Card` for lists. Server-side pagination, sorting and filtering.
4. Regenerate the API types (`npm run api:generate`) and use the typed client. Never hand-write an API type.
5. Run `npm run lint`, `npm run typecheck` and `npm run build`.
