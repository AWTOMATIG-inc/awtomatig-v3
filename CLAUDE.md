@AGENTS.md

# Claude-specific notes

- This file is the repo-wide entry point. Each folder has its own `CLAUDE.md` that loads that folder's rules, memory and design docs when you work inside it. Read those too.
- The system docs are imported below. Treat them as the source of truth for cross-folder decisions.
- When implementing from Figma (Figma MCP), map Figma values to the existing tokens and `type-*` utilities instead of copying raw px or hex values. If a value has no matching token, flag it to the user rather than silently inlining it. This applies to `frontend/` and `admin/`.
- After a design token changes, update the CSS tokens and that folder's `DESIGN.md` in the same change. A change to a token that `admin/` copies from `frontend/` is mirrored in both (see `admin/DESIGN.md`).
- Each `MEMORY.md` is project memory. When you make a decision, ship something or resolve an open item, update its status table, decisions, open items and change log.

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
