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

- **[AGENTS.md](AGENTS.md)** — project and code rules: structure, component conventions, the Tailwind-only rule
- **[DESIGN.md](DESIGN.md)** — the design system: tokens, type scale, spacing, components, patterns
- **[MEMORY.md](MEMORY.md)** — project memory: current status, key decisions and why, gotchas, open items, change log
- **[AUDIT_FIX_PLAN.md](AUDIT_FIX_PLAN.md)** — the staged plan for fixing the 2026-10-09 engineering audit's findings

This repo is also read by Claude Code; `CLAUDE.md` points it at the same three files.

## Deployment

Deployed on [Vercel](https://vercel.com). Pushing to the production branch triggers a build; see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for the general flow.
