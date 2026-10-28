# AWTOMATIG: Agent instructions

Instructions for AI coding agents (and a quick orientation for people) working anywhere in this repository. They apply to all three folders. Each folder adds its own rules.

## What this repo is

One git repository, three independent apps that never import from each other (the only contract is the backend's OpenAPI spec):

| Folder | What it is | Stack | State |
| --- | --- | --- | --- |
| `frontend/` | Public marketing website | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 | Built |
| `backend/` | API: CMS and ERP modules | NestJS 11 (Fastify), PostgreSQL, Drizzle, zod, TypeScript | Scaffolded, no business module yet |
| `admin/` | Internal employee UI (CMS and ERP screens) | Next.js 16, TypeScript, Tailwind CSS v4, TanStack Query and Table, Recharts | Scaffolded (shell, dashboard); sign-in not wired |

## Read before you work

Always read the root docs, then the docs of the folder you are changing:

| Scope | Architecture | Rules | Memory | Design |
| --- | --- | --- | --- | --- |
| Whole repo | [ARCHITECTURE.md](ARCHITECTURE.md) | [RULES.md](RULES.md) | [MEMORY.md](MEMORY.md) | |
| `frontend/` | (root) | [RULES.md](frontend/RULES.md) | [MEMORY.md](frontend/MEMORY.md) | [DESIGN.md](frontend/DESIGN.md) |
| `backend/` | [ARCHITECTURE.md](backend/ARCHITECTURE.md) | [RULES.md](backend/RULES.md) | [MEMORY.md](backend/MEMORY.md) | |
| `admin/` | [ARCHITECTURE.md](admin/ARCHITECTURE.md) | [RULES.md](admin/RULES.md) | [MEMORY.md](admin/MEMORY.md) | [DESIGN.md](admin/DESIGN.md) |

If a folder's rule and a root rule conflict, the folder's rule wins for that folder, and the conflict should be fixed. If a task conflicts with a rule, stop and ask instead of working around it.

## Working rules (all folders)

1. **Stay in your folder.** Never import across `frontend/`, `backend/` and `admin/`. Run commands from inside the folder you are changing (each has its own `package.json`).
2. **Keep the docs true.** A new convention, component, decision or open item is written down in the same change: in the folder's own docs, or in the root docs if it affects more than one folder. Each folder's `MEMORY.md` has a status table, decisions, open items and a change log; update it when you decide, ship or resolve something.
3. **If docs and code disagree, the code wins.** Then fix the docs.
4. **Verify before saying done.** Run the folder's type-check, lint and build (and tests, where they exist), and report what was and was not checked.
5. **No surprises.** Do not add a dependency, change the architecture, or touch a database migration unless the request includes it.
6. **Secrets stay out of git.** No `.env` files, no real data, and no secret in a `NEXT_PUBLIC_*` variable.

## Commands

Each folder defines its own scripts. Run them from inside the folder.

- `frontend/`: `npm run dev`, `npm run build`, `npm run lint` (ESLint, the token check, Prettier), `npm run format`. Details in [frontend/RULES.md](frontend/RULES.md).
- `backend/`: `npm run start:dev`, `npm run build`, `npm run typecheck`, `npm run lint` (ESLint, the module-boundary check, Prettier), `npm test`, `npm run db:generate` / `db:migrate`, `npm run openapi:export`. Details in [backend/README.md](backend/README.md).
- `admin/`: `npm run dev` (port 3001), `npm run build`, `npm run typecheck`, `npm run lint` (ESLint, the token sync check against the website, Prettier), `npm run format`, `npm run api:generate`. Details in [admin/README.md](admin/README.md).

## Next.js notice

`frontend/` (and `admin/` once it exists) uses a Next.js version with breaking changes from most training data. Before writing Next.js code, read the relevant guide in that folder's `node_modules/next/dist/docs/`, and heed deprecation notices. `next dev` maintains the notice block in `frontend/AGENTS.md`; leave it alone.
