@AGENTS.md

# Claude-specific notes

- This file is the repo-wide entry point. Each folder has its own `CLAUDE.md` that loads that folder's rules, memory and design docs when you work inside it. Read those too.
- The system docs are imported below. Treat them as the source of truth for cross-folder decisions.
- When implementing from Figma (Figma MCP), map Figma values to the existing tokens and `type-*` utilities instead of copying raw px or hex values. If a value has no matching token, flag it to the user rather than silently inlining it. This applies to `frontend/` and `admin/`.
- After a design token changes, update the CSS tokens and that folder's `DESIGN.md` in the same change. A change to a token that `admin/` copies from `frontend/` is mirrored in both (see `admin/DESIGN.md`).
- Memory has two levels. A folder's `MEMORY.md` is the detailed record of the work in that folder (status table, decisions, open items, dated change log with what was verified). The root `MEMORY.md` is the overview: one status row per folder and a short change-log line per piece of work saying which folder changed. When you decide, build, fix, clean up or resolve something, update the folder's memory and add the root line in the same change, before you report the task done.

@ARCHITECTURE.md

@RULES.md

@MEMORY.md

# CodeGraph

`frontend/` is indexed with CodeGraph (`frontend/.codegraph/`, local only and git-ignored). When exploring the frontend, run the commands from inside `frontend/` and prefer them over broad Grep/Glob sweeps.

- `codegraph explore "<topic>"`: relevant symbols' source and call paths in one shot. Start here for "how does X work".
- `codegraph context "<task>"`: relevant symbols, relationships and code blocks for a task.
- `codegraph query <symbol>`: find a symbol by name.
- `codegraph node <name>`: one symbol's source with its callers and callees, or a file with line numbers and dependents.
- `codegraph files`: the indexed project structure.
- `codegraph sync`: refresh the index after changes (`codegraph index` rebuilds from scratch).

Still read the actual file before editing it.
