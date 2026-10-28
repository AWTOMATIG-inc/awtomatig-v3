# AWTOMATIG

Marketing site for AWTOMATIG, built with Next.js 16 (App Router, Turbopack), React 19, TypeScript and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build; run it to verify changes before committing
- `npm run lint` — ESLint, then `scripts/check-tokens.mjs` (the design-system guardrails)

## Documentation

Read these before making a change, in this order:

- **[../RULES.md](../RULES.md)** and **[../ARCHITECTURE.md](../ARCHITECTURE.md)** — the repo-wide rules and system architecture (this folder is one of `frontend/`, `backend/` and `admin/`)
- **[../AGENTS.md](../AGENTS.md)** — repo-wide agent instructions
- **[RULES.md](RULES.md)** — the frontend's rules: structure, component conventions, the Tailwind-only rule
- **[DESIGN.md](DESIGN.md)** — the design system: tokens, type scale, spacing, components, patterns
- **[MEMORY.md](MEMORY.md)** — project memory: current status, key decisions and why, gotchas, open items, change log
- **[AUDIT_FIX_PLAN.md](AUDIT_FIX_PLAN.md)** — the staged plan for fixing the 2026-10-09 engineering audit's findings

This repo is also read by Claude Code; `CLAUDE.md` points it at the same three files.

## Environment

Copy `.env.example` to `.env`. `NEXT_PUBLIC_GTM_ID` loads Google Tag Manager (GA4 and Microsoft Clarity) in production builds only. `NEXT_PUBLIC_*` values are baked in at build time, so rebuild after changing them.

## Deployment

Self-hosted on a VPS: `npm ci && npm run build && npm run start` behind a reverse proxy.
