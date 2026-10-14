@AGENTS.md

# Claude-specific notes

- The full design system guideline is imported below. Follow it for every UI change, and treat `app/globals.css` as the source of truth for token values.
- When implementing from Figma (Figma MCP), map Figma values to the existing tokens and `type-*` utilities instead of copying raw px or hex values. If a value has no matching token, flag it to the user rather than silently inlining it.
- After a design token changes, update both `app/globals.css` and DESIGN.md in the same change.
- MEMORY.md (imported below) is the project memory. When you make a decision, ship a section or resolve an open item, update its status table, decisions, open items and change log.

@MEMORY.md

@DESIGN.md

# CodeGraph

This project is indexed with CodeGraph (`.codegraph/`, local only and git-ignored). Prefer it over broad Grep/Glob sweeps when exploring the code.

- `codegraph explore "<topic>"`: relevant symbols' source and call paths in one shot (same as the `codegraph_explore` MCP tool). Start here for "how does X work".
- `codegraph context "<task>"`: relevant symbols, relationships and code blocks for a task.
- `codegraph query <symbol>`: find a symbol by name.
- `codegraph node <name>`: one symbol's source with its callers and callees, or a file with line numbers and dependents. Use it to check what a change affects.
- `codegraph files`: the indexed project structure.
- `codegraph sync`: refresh the index after changes. If results look stale, run it first (`codegraph index` rebuilds from scratch).

Still read the actual file before editing it.
