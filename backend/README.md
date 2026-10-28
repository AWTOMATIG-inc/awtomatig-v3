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
| `npm test` | Unit and API tests (no database needed). |
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
    health/   GET /api/v1/health/live and /ready
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
