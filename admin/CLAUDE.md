# Admin (Claude Code)

The repo-wide instructions come from the root `CLAUDE.md` and `AGENTS.md`. This file loads the admin app's own docs.

@AGENTS.md

- DESIGN.md is the UI guideline for every screen. Follow it, and treat the token block in `app/globals.css` as the source of truth for values.
- When a token copied from `frontend/` changes, mirror it in both places and in both DESIGN.md files; `npm run lint` fails if they drift.
- MEMORY.md is this folder's memory: the detailed record of the work done here. When you decide, build a screen, fix, clean up or resolve an open item, update its status table, decisions, open items and dated change log, and add a one-line overview entry to the root `../MEMORY.md` (which folder changed and what), in the same change.

@ARCHITECTURE.md

@RULES.md

@DESIGN.md

@MEMORY.md
