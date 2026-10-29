# AWTOMATIG Backend

The API behind the website and the admin app: CMS and ERP modules, as a modular monolith. NestJS (Fastify), PostgreSQL, Drizzle, zod.

Read [ARCHITECTURE.md](ARCHITECTURE.md) and [RULES.md](RULES.md) before changing anything. Status and decisions are in [MEMORY.md](MEMORY.md).

## Getting started

```bash
cp .env.example .env                              # then edit if needed
docker compose -f docker-compose.dev.yml up -d    # local PostgreSQL (or point DATABASE_URL at your own)
npm install
npm run start:dev                                 # http://127.0.0.1:4000/api/v1, docs at /api/docs
```

Requires Node 22 or newer.

## Commands

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Dev server with reload. Interactive API docs at `/api/docs` (development only). |
| `npm run build` / `npm start` | Compile to `dist/` / run the compiled server. |
| `npm run typecheck` | `tsc` over `src/` and `test/`. |
| `npm run lint` | ESLint, the module-boundary check, then Prettier. CI runs this. |
| `npm test` | Unit and API tests (no database needed). Set `TEST_DATABASE_URL` to a migrated PostgreSQL to also run the sign-in end-to-end test (`test/auth.e2e-spec.ts`); it creates and removes its own users. |
| `npm run seed:admin` | Create the first administrator from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (and `SEED_ADMIN_NAME`). Safe to repeat; add `-- --reset-password` to change an existing password. |
| `npm run check:boundaries` | Fails if a module reaches into another module's `repo/`, `domain/`, `api/` or schema, or if `domain/` imports a framework. |
| `npm run db:generate` | Create a migration from the module schemas (`src/modules/*/schema.ts`, `src/shared/**/*.schema.ts`). |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL`. |
| `npm run openapi:export` | Regenerate `openapi.json`. Commit it with any endpoint change. |

## Layout

```
src/
  main.ts  bootstrap.ts  app.module.ts   # entry, app factory, composition root
  openapi-export.ts                      # writes openapi.json
  shared/                                # infrastructure only, no business logic
    config/   env.ts (zod-validated env), AppConfig
    db/       Database (pool + Drizzle), columns.ts (id, timestamps, author, money)
    errors/   AppError types, AllExceptionsFilter (the one error shape)
    logging/  structured JSON logs, secrets redacted
    health/   GET /api/v1/health (details), /health/live, /health/ready
    openapi/  OpenAPI document and dev docs UI
  modules/                               # one folder per business module (none yet)
test/                                    # API tests against the real app, no database
```

## Adding a module

1. Create `src/modules/<name>/` with `api/ service/ domain/ repo/ schema.ts events.ts README.md` and a `<name>.module.ts`.
2. In `schema.ts` declare the module's Postgres schema (`pgSchema("<name>")`) and its tables, using `baseColumns` from `shared/db/columns.ts`.
3. Run `npm run db:generate`, review the SQL, commit it.
4. Add the module to `imports` in `src/app.module.ts`.
5. Run `npm run lint` and `npm test`.

## Environment

Every value is validated at boot (`src/shared/config/env.ts`); the app refuses to start on a missing or invalid one. See `.env.example`.

The CRM needs `LEAD_INGEST_KEY` (32+ random characters), shared with the website's server: only a request that sends it as the `x-ingest-key` header can add a lead.

Authentication needs `BETTER_AUTH_SECRET` (32+ random characters; rotating it signs everyone out) and `BETTER_AUTH_URL` (the public origin of the admin app, because the browser calls `/api` on that origin and Next.js rewrites it here).

## Authentication

Better Auth is mounted at `/api/v1/auth/*` (sign-in, sign-out, change password); `GET /api/v1/auth/session` returns who is signed in, their roles and permissions. Sign-up is closed.

- Every endpoint is private by default. Opt out with `@Public()` (health, the Better Auth handler); add `@RequirePermission('module.resource.action')` to declare the permission. `hasPermission` supports `*`, `crm.*` and `crm.lead.*`.
- First setup: apply the migration (`npm run db:migrate`), then `npm run seed:admin`. Remove `SEED_ADMIN_PASSWORD` from `.env` afterwards. There is no 2FA for now (see MEMORY.md).
- Sign-ins and failed sign-ins are written to `core.audit_log` (user id, address and a reason code; never the password or the email).

## Deploying to the VPS (first time)

Written from the existing setup (PM2 + Nginx, Node 22, PostgreSQL already installed); **not yet run on the server**, so check each step's output. The API listens on 127.0.0.1:4000 only. The admin app's `/api` rewrite reaches it, so Nginx needs no new site.

1. **Database and role** (on the VPS, as a sudoer). Use a password without `@ : / ? # %` so it can sit in a URL (`openssl rand -hex 24`):

   ```bash
   sudo -u postgres psql -c "CREATE ROLE awtomatig LOGIN PASSWORD '<password>';"
   sudo -u postgres psql -c "CREATE DATABASE awtomatig OWNER awtomatig;"
   psql "postgres://awtomatig:<password>@127.0.0.1:5432/awtomatig" -c "select version();"   # must print a version
   ```

2. **Environment** in `backend/.env` (`chmod 600`; every value is checked at boot): `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=4000`, `TRUST_PROXY=true`, `DATABASE_URL`, `CORS_ORIGINS=https://admin.awtomatig.com`, `BETTER_AUTH_URL=https://admin.awtomatig.com`, and two new secrets from `openssl rand -hex 32`: `BETTER_AUTH_SECRET` and `LEAD_INGEST_KEY` (the website's `.env` gets the same `LEAD_INGEST_KEY` plus `CRM_API_URL=http://127.0.0.1:4000`).

3. **Install, build, migrate** (dev dependencies are needed for the build and `drizzle-kit`):

   ```bash
   cd ~/awtomatig-v3/backend
   npm ci --include=dev
   npm run build
   npm run db:migrate          # "migrations applied successfully"; if it only exits 1, check the role owns the database
   ```

4. **First administrator**, passing the password on the command line so it is never written to a file (a leading space keeps it out of the shell history):

   ```bash
    SEED_ADMIN_EMAIL='you@example.com' SEED_ADMIN_NAME='Your Name' SEED_ADMIN_PASSWORD='<12+ characters>' npm run seed:admin
   ```

   Change a password later with the same command plus `-- --reset-password`.

5. **Run it under PM2**, then check it:

   ```bash
   pm2 start dist/main.js --name awtomatig-api --cwd ~/awtomatig-v3/backend
   pm2 save
   curl -s http://127.0.0.1:4000/api/v1/health      # {"status":"ok","database":"up",...}
   ```

6. **Website and admin:** add `CRM_API_URL` and `LEAD_INGEST_KEY` to `frontend/.env`. The admin has no default backend address any more, so `admin/.env` must contain `API_URL=http://127.0.0.1:4000` (read when the admin is built: rebuild it, then `pm2 restart awtomatig-admin`). Restart the website with `pm2 restart awtomatig-web --update-env`. Sign in at https://admin.awtomatig.com, send a test inquiry on the Contact page, and look for it under Contact Inquiries.

7. **Every later deploy** of `backend/` (add to the VPS `deploy.sh` next to the other folders): `npm ci --include=dev && npm run build && npm run db:migrate && pm2 restart awtomatig-api`. Migrations run before the restart and must work with the previous version (backend RULES.md section 3). Never edit or squash a migration that has run on the server.

Keep PostgreSQL (5432) and the API (4000) off the public internet: `ss -tlnp | grep -E ':4000|:5432'` should show only 127.0.0.1. Back the database up (RULES.md section 7); a stopgap is a nightly `pg_dump` to another machine.
