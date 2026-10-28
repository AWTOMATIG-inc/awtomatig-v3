# Backend: Memory

Backend context: status, decisions and why, gotchas, open items and the change log. Read it before starting work in `backend/`, and update it when you decide, ship or resolve something.

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) (decisions B1 to B7)
- **Rules:** [RULES.md](RULES.md)
- **How to run it:** [README.md](README.md)
- **System context:** [../ARCHITECTURE.md](../ARCHITECTURE.md), [../MEMORY.md](../MEMORY.md)

---

## 1. Current status

_Last updated: 2026-10-28_

| Area | Status | Location |
| --- | --- | --- |
| Architecture and rules | Written | this folder |
| Project scaffold (NestJS 11 + Fastify, TypeScript strict, ESLint, Prettier, Jest) | ✅ Built; `npm run lint`, `typecheck`, `build` and `test` (9 tests) pass | this folder |
| Config validation | ✅ zod, fails at boot | `src/shared/config/` |
| Database access (pg pool + Drizzle, column helpers) | ✅ Built; verified against an unreachable database and by generating a sample migration, **not yet against a live PostgreSQL** | `src/shared/db/` |
| Error shape, structured logging, request id, rate limiting, CORS, security headers | ✅ Built and tested | `src/shared/errors/`, `logging/`, `src/bootstrap.ts` |
| Health endpoints (`/live`, `/ready`) | ✅ Built | `src/shared/health/` |
| OpenAPI contract (`openapi.json`, dev docs UI at `/api/docs`) | ✅ Built | `src/shared/openapi/`, `openapi.json` |
| Module-boundary check in lint | ✅ Built; rules checked with deliberate violations | `.dependency-cruiser.cjs` |
| `shared/` kernel: auth, RBAC, audit, events, jobs, storage | Not started | `src/shared/` |
| `crm` module (website contact form to leads) | Not started, first module to build | `src/modules/crm/` |
| `cms` module | Not started, blocked on the CMS decision | `src/modules/cms/` |
| Migrations applied, backups | No migrations yet; backups not provisioned | `drizzle/` |

## 2. Key decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) section 7 (B1 to B7). Record new decisions there, and the reasoning that does not fit in a table row here.

- **NestJS 11, not 12.** NestJS 12 is the current release, but `nestjs-zod` (5.5) and `@nestjs/swagger` 11 declare support for Nest 10 and 11 only. Move to 12 when `nestjs-zod` supports it.
- **TypeScript 5.9, not 7.** `@nestjs/swagger` supports TypeScript 5.5 and 6 only.
- **`fastify` is overridden to `^5.12.7`** in `package.json` because `@nestjs/platform-fastify` 11.2.8 pins 5.11.3, which has high-severity advisories. Remove the override when Nest ships a patched pin.

## 3. Gotchas

- **Nest DI needs value imports.** Do not turn on `consistent-type-imports`: it would turn an injected class into a type import and break `emitDecoratorMetadata`.
- **`@fastify/static` v10 is ESM-only**, which Jest cannot load. The dev docs UI therefore runs only when `NODE_ENV=development`, so tests and production never load it.
- **`nestjs-pino` ignores `autoLogging.ignore` on Fastify**, so `/health/*` requests are still logged. Fix or filter before a monitor polls these often.
- **The request id is Fastify's** (`genReqId` and `requestIdHeader` in `bootstrap.ts`), echoed in the `x-request-id` response header and used by the logs. Setting `genReqId` in the pino options has no effect.
- **The rate limiter's error goes through the normal filter**, so it comes back as `{ code: "TOO_MANY_REQUESTS", message }`.
- **Drizzle is created without a schema object on purpose**, so no shared object exposes every module's tables. Repos import their own module's tables.
- **`npm install` blocks install scripts** (esbuild and others). That is fine here: `drizzle-kit` and `nest build` ran without them.
- Remaining `npm audit` items are moderate or low, in dev tooling (`drizzle-kit`'s old esbuild, `@nestjs/cli`) and in `nestjs-zod` (`deepmerge`) and `@nestjs/swagger` (`js-yaml`). Re-check when those packages update.

## 4. Open items

See ARCHITECTURE.md section 6: CMS (Payload vs custom), auth library, accounting design, module order.

- [ ] Provision the staging and production Postgres on the VPS with WAL archiving and a first restore test.
- [ ] Run the stack against a live PostgreSQL (`docker compose -f docker-compose.dev.yml up -d`, `/api/v1/health/ready`, a first migration). It was not done in the scaffold session because no database was available.
- [ ] Decide the host and path for the API (`api.awtomatig.com` or `/api` behind Nginx) and update the frontend CSP.
- [ ] CI pipeline (type-check, lint, tests, migrations on a throwaway Postgres, an `openapi.json` freshness check).
- [ ] Hide `/health/*` from the access log.
- [ ] Add `shared/auth`, `rbac`, `audit`, `events`, `jobs` (pg-boss) and `storage` as the first modules need them, not before.

## 5. Change log

Newest first.

| Date | Change |
| --- | --- |
| 2026-10-28 | **Backend scaffolded.** NestJS 11 on Fastify, TypeScript strict, zod config, pg + Drizzle (`Database`, `baseColumns`, `money`), a single error shape, pino logging with request ids, Helmet, CORS, rate limiting, health endpoints, OpenAPI export, dependency-cruiser boundary rules, Jest (unit + API tests), `docker-compose.dev.yml`. Verified: `typecheck`, `lint`, `build`, `test` (9 passing), a dev server boot (health, docs, 404, bad env), a sample migration, and the boundary rules against deliberate violations. No business module yet. |
| 2026-10-28 | Wrote `ARCHITECTURE.md`, `RULES.md` and this file. No code yet. |
