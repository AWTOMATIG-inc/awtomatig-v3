@AGENTS.md

# Claude-specific notes

- The full design system guideline is imported below. Follow it for every UI change, and treat `app/globals.css` as the source of truth for token values.
- When implementing from Figma (Figma MCP), map Figma values to the existing tokens and `type-*` utilities instead of copying raw px or hex values. If a value has no matching token, flag it to the user rather than silently inlining it.
- After a design token changes, update both `app/globals.css` and DESIGN.md in the same change.
- MEMORY.md (imported below) is the project memory. When you make a decision, ship a section or resolve an open item, update its status table, decisions, open items and change log.

@MEMORY.md

@DESIGN.md
