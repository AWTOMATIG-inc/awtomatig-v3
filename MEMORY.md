# AWTOMATIG: Project Memory

The project's running memory: where things stand, what was decided and **why**, and what's still open. Read it before starting work. Update it whenever a decision is made, a section ships, or an open item is resolved.

- **How to build things:** [DESIGN.md](DESIGN.md) (design system) and [AGENTS.md](AGENTS.md) (agent and code rules)
- **This file:** context, decisions, status and history that those documents don't capture

---

## 1. Current status

_Last updated: 2026-10-01_

| Area | Status | Location |
| --- | --- | --- |
| Design system (tokens, type, spacing, radius, effects) | ✅ Implemented | `app/globals.css`, documented in DESIGN.md |
| Site container (1440px) | ✅ Implemented | `@utility site-container` in `globals.css` |
| Button (5 variants, 2 sizes) | ✅ Implemented | `app/components/ui/button/` |
| Icons (WhatsApp, Mail) | ✅ Implemented | `app/components/icons/` |
| Navbar | ✅ Built | `app/components/layout/header/` |
| Home → Hero | ✅ Built | `app/components/sections/home/hero/` |
| Home → other sections | ⏳ Waiting for Figma designs | `app/components/sections/home/<section>/` |
| Footer | ⏳ Not designed yet | goes in `app/components/layout/footer/` |
| Other pages (Services, Case Studies, Contact, About) | ⏳ Not designed yet | Nav links currently point to `#anchors` |

**Next up:** build the next Figma section, and confirm the inferred values in [§4](#4-open-items).

---

## 2. Key decisions (and why)

| # | Decision | Why |
| --- | --- | --- |
| D1 | **Tailwind's default colors, radii and shadows are disabled** (`--color-*: initial`, etc.) | Makes it impossible to use off-system values by accident. Only design tokens exist. |
| D2 | **Spacing unit = 1px** (`--spacing: 1px`), so `p-16` = 16px | Utilities read directly in Figma pixels. ⚠️ `p-4` is 4px here, not 16px. |
| D3 | **Text styles are `type-*` utilities** (e.g. `type-heading-40`) that set family, size, line height, tracking and weight together | One class per Figma text style keeps typography consistent. Display and large headings scale with `clamp()`. |
| D4 | **Fonts:** Inter Tight for display and headings, Inter for body and labels, both through `next/font` | Taken from the Figma typography spec. Self-hosted, with no layout shift. |
| D5 | **Max container width 1440px** (the Figma frame); content only, **backgrounds stay full-bleed** | Requested so content never stretches on ultra-wide screens while backgrounds still reach the edges. |
| D6 | **The `--u` frame scale is capped at 1px** | The header and hero use `calc(var(--u) * N)` to scale Figma px with the viewport. The cap stops growth past 1440px, matching the container. |
| D7 | **Per-section gutters** through `--gutter-start` / `--gutter-end` instead of `px-*` | The navbar (49/60px) and hero (72/60px) have their own Figma padding; the default is 60px desktop and 24px mobile. |
| D8 | **One `<Button>` component** with variants `primary`, `glass`, `tint`, `dark`, `light`, `outline` and sizes `md` (40px) and `lg` (54px; 50px on mobile) | Five unique button types were found across the Figma screenshots, and `tint` was added later for the navbar CTA. The variant is chosen by the surface the button sits on. |
| D9 | **Folder structure:** `ui/` (primitives), `icons/`, `layout/` (site chrome), `sections/<page>/<section>/` | Keeps reusable parts separate from page-specific ones, so it's always clear where a file goes. |
| D10 | **Component CSS is colocated** (`header.css` next to `Header.tsx`) and `@import`ed from `globals.css` | One CSS bundle keeps the Tailwind layer order (theme → base → components → utilities). Next.js recommends against scattering global CSS imports. |
| D11 | **The WhatsApp phone glyph is a cut-out** (`fillRule="evenodd"`), not white | In Figma the phone shows the button's own background (dark on glass, white on light). |
| D12 | **Primary button has no resting glow**, only a glow on hover | The Figma screenshots show no glow at rest. |
| D13 | Semantic color roles: `text/primary` → Charcoal, `text/strong` → Black | Assumed; the export didn't say. See open items. |

---

## 3. Gotchas

- **Next.js 16 is newer than most training data.** Read `node_modules/next/dist/docs/` before using an API. `next dev` rewrites the block at the top of AGENTS.md; leave it alone.
- **Spacing is 1px-based** (D2). Copying Tailwind snippets from elsewhere will produce tiny spacing.
- **Classes like `text-slate-400` or `rounded-lg` silently produce nothing** (D1). Use tokens.
- **New component CSS must be registered** with an `@import` at the top of `app/globals.css` (`ui/` first, then `layout/`, then `sections/`), or it won't load.
- **Don't put `site-container` on an element that has a background**; wrap the content inside it instead.
- **Inside the header and hero, `<Button>` scales with `--u`.** Outside them, 1 design px = 1px.
- **Header CTA on very narrow phones (<360px):** the label is visually hidden but still read by screen readers. Don't switch it to `display: none`.
- **Local visual checks:** headless Chrome won't render narrower than ~500px, so use an `<iframe width=390>` page for mobile. Don't pass `--virtual-time-budget`, because the hero canvas animation makes it hang. Python is not installed on the dev machine.

---

## 4. Open items

Confirm these against Figma, then update `globals.css`, DESIGN.md and this file:

- [ ] Line height and letter spacing of most text styles (only Display/100, Heading/18 and Body/20 were measured)
- [ ] `text/primary` vs `text/strong` color mapping (D13)
- [ ] Exact **Card / Soft** and **Floating / Ambient** shadow values
- [ ] Label style weight and tracking (currently 600, +0.01em for Upper)
- [ ] Button label sizes: 13px (`md`) and 15px (`lg`) vs the Label 14/16 styles. Is there a dedicated button text style?
- [ ] Hover states for the `dark`, `light` and `outline` buttons (inferred; the screenshots showed resting states only)
- [ ] Hero atmospheric colors outside the palette (teal bloom gradient, tag gray `#A5AAAA`): turn them into tokens or replace them with opacity equivalents?
- [ ] Real WhatsApp link (`WHATSAPP_URL` in `Header.tsx` is a `#contact` placeholder)
- [ ] Hero badge text "Build the systemssss." looks like a typo
- [ ] The mobile-menu CTA uses `outline` (black label, meant for light surfaces) inside the dark dropdown, so it has low contrast. Confirm the intended mobile design, possibly `tint` or `light`.
- [ ] Hero avatars are Unsplash placeholders; replace them with real team photos

---

## 5. Change log

Newest first. Add one line per meaningful change.

| Date | Change |
| --- | --- |
| 2026-10-01 | Navbar "Message us" now matches the new Figma screenshot: added the borderless `tint` Button variant and tuned `.nav-cta` to 142×40, 17px icon, 11px gap, 13.5px label. The mobile-menu CTA was switched to `outline` (by the user). |
| 2026-10-01 | Added `MEMORY.md` (this file). |
| 2026-10-01 | Added the `<Button>` component (5 variants, 2 sizes) and the icons `WhatsAppIcon` and `MailIcon`. Restructured components into `ui/`, `icons/`, `layout/` and `sections/`, with colocated CSS. Navbar and hero CTAs now use `<Button>`. Removed the unused `IsoCube` and `CubeIcon`. Added the `--color-deep-teal` token. |
| 2026-10-01 | Added the 1440px `site-container`. Navbar and hero content are wrapped in it, backgrounds stay full-bleed, and the `--u` scale is capped at 1px. |
| 2026-10-01 | Updated AGENTS.md and CLAUDE.md with project and design-system rules. CLAUDE.md imports DESIGN.md. |
| 2026-10-01 | Implemented the design system from the Figma export: `@theme` tokens, `type-*` text styles and the Inter Tight font. Rewrote DESIGN.md as a full guideline. |
| 2026-09-30 | Initial commit: Next.js 16 app with the Navbar and the interactive Hero. |
