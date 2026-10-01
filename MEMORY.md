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
| Home → Services (4 stacking cards) | ✅ Built | `app/components/sections/home/services/` |
| Home → other sections | ⏳ Waiting for Figma designs | `app/components/sections/home/<section>/` |
| Footer | ⏳ Not designed yet | goes in `app/components/layout/footer/` |
| Other pages (Services, Case Studies, Contact, About) | ⏳ Not designed yet | Nav links currently point to `#anchors` |

**Next up:** build the next Figma section after Services, and confirm the inferred values in [§4](#4-open-items).

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
| D14 | **Tailwind first; component CSS only for what utilities can't express** (frame-scale vars, safe-area math, pseudo-element layers, complex gradients, multi-property transitions). The table is in DESIGN.md §10.1. | The Navbar and Hero had drifted into ~500 lines of hand-written CSS that bypassed `type-*`, color tokens and the opacity steps. One clear split removes the "Tailwind or CSS?" question. |
| D15 | **Frame scale drives Tailwind:** frame-scaled sections set `--spacing: var(--u)` from `lg` up, and fixed `type-*` sizes are `calc(var(--u, 0.0625rem) * N)` | Tailwind spacing utilities compile to `calc(var(--spacing) * N)`, so pixel-locked markup can be plain Tailwind (`gap-36`, `w-250`) and still scale with the 1440 frame. Outside a frame, text stays `rem`. |
| D16 | **Glass is one material**: `--glass-*` tokens plus the `glass` utility. The Display gradient is `--gradient-display` plus `text-gradient-display`. | The navbar pill and mobile menu had separate hard-coded recipes. Literals now live only in `@theme`. |
| D17 | **The hero background (`.hero`, `.top-right-glow`, `.noise-overlay`, canvas) is atmospheric art matched to the Figma screenshots**, exempt from the token check (`/* token-check: off */`). Change it only to match the design, by measuring the screenshot. | It is art sampled from the design, not reusable UI. This resolves the "hero atmospheric colors" open item. Canvas spec (2026-10-01): white sawtooth bands every 78 design px (crisp edge on the corner side, even fade over one period) generated across the whole hero, top-left corner included, with a radial mask from the top-right measured from the full-frame screenshot (≈100% top-right, ≈35% beside the headline, ≈20% bottom and middle-left, ≈5% bottom-left), plus two crisp lasers with a white → cyan → fade gradient along their length. The design measures ≈2.6% band strength and laser 1 at ≈102 design px from the corner; `BAND_ALPHA` (0.054) and `LASER_OFFSET` (20) are currently set by hand above those. |
| D18 | **Display / 100 has a two-stage curve**: 42px → `10vw` → 72px below `lg`, then 72 → 100px with the frame | The single `6.944vw` curve made the tablet hero title too small (~53px at 768). The old hero CSS also jumped from 84px to 72px at 1024; the new curve is continuous. The 42px minimum matches what the hero shipped with. |
| D19 | **Token guardrails in lint**: an ESLint rule bans arbitrary color values in `className`, and `scripts/check-tokens.mjs` bans raw color literals in component CSS | Keeps the drift from coming back without adding dependencies. |
| D20 | **Service cards are one layout mapped over data** (`ServiceCard.tsx` + `services.ts`); only the content and a theme (`light`, `cyan`, `subtle`, `dark`) change per card | The four Figma cards share one structure and differ only in copy, image and surface colors. |
| D21 | **Stacking uses CSS `position: sticky` plus a small client measurer** (`StackingCards.tsx`), not a scroll library. Sticky `top = min(0, viewport − card height)`; a covered card scales to 94%, rounds to radius/34 and dims to 40% black | Native sticky reverses on scroll up for free. Measuring the height lets cards taller than the viewport (every card on phones) be read in full before they pin. The section is not frame-scaled; it uses the normal scale and fluid `type-*`. |
| D22 | **New token `--color-ink` (#111111) with the semantic `surface-deep`** for the Ad Tech card | Measured from the screenshot: the card is #111111 under a charcoal (#1E1E1E) panel, and no existing token matched. |

---

## 3. Gotchas

- **Next.js 16 is newer than most training data.** Read `node_modules/next/dist/docs/` before using an API. `next dev` rewrites the block at the top of AGENTS.md; leave it alone.
- **Spacing is 1px-based** (D2). Copying Tailwind snippets from elsewhere will produce tiny spacing.
- **Classes like `text-slate-400` or `rounded-lg` silently produce nothing** (D1). Use tokens.
- **New component CSS must be registered** with an `@import` at the top of `app/globals.css` (`ui/` first, then `layout/`, then `sections/`), or it won't load.
- **Don't put `site-container` on an element that has a background**; wrap the content inside it instead.
- **Inside the header and hero (from `lg` up), `<Button>`, the fixed `type-*` styles and every Tailwind spacing utility scale with `--u`** because those sections set `--spacing: var(--u)`. Outside them, 1 design px = 1px. Below `lg`, `--u` is unset in both sections.
- **Component CSS is mobile-first** with `@variant lg { … }`. VS Code's built-in CSS linter flags `@variant`, `@apply`, `@theme` and `@utility` as unknown at-rules; that warning is harmless.
- **`next/image` with a non-square PNG:** size it with one dimension plus `h-auto` (e.g. `w-16 h-auto`). `size-*` squashes it.
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
- [x] ~~Hero atmospheric colors outside the palette~~: the background is kept as is (D17); the tag gray `#A5AAAA` became `text-white/60`.
- [ ] Hero tags now follow the Tag list pattern (`type-body-16`, was 18px). Is there a Body / 18 style in Figma?
- [ ] Hero proof line and strip title now use `type-heading-18` / `type-heading-20` (Inter Tight); before they rendered in Inter. Confirm the family in Figma.
- [ ] Real WhatsApp link (`WHATSAPP_URL` in `Header.tsx` is a `#contact` placeholder)
- [ ] Hero badge text "Build the systemssss." looks like a typo
- [ ] The mobile-menu CTA currently uses `tint` inside the dark dropdown. Confirm the intended mobile design.
- [ ] Hero avatars are Unsplash placeholders; replace them with real team photos
- [ ] Service card CTAs ("Explore our services") point to `#contact` until the Services page exists (`href` in `services.ts`)
- [ ] Confirm `--color-ink` (#111111) for the Ad Tech card in Figma (D22)
- [ ] Service card values measured from screenshots, not Figma: top padding 70px (outside the spacing scale), title `type-heading-60` (measured ≈60–63px), index `type-heading-34` at regular weight, panel 20px from the frame edge, 25px column gap (an "observed" value). The bottom of each card was cropped in the screenshots, so the panel is assumed flush with the card bottom.

---

## 5. Change log

Newest first. Add one line per meaningful change.

| Date | Change |
| --- | --- |
| 2026-10-01 | **Home → Services section built**: four full-bleed stacking cards (Website Infrastructure, Back-Office Operations, ERP & Business Systems, Ad Tech) rendered from one `ServiceCard` layout and a `SERVICES` array. Cards pile up on scroll (sticky + `StackingCards` client measurer) and reverse on scroll up. Layout and colors are pixel-sampled from the screenshots; responsive from 320px (1-column points, center-cropped image) to 1440px+. Added the `ink` / `surface-deep` token. DESIGN.md (palette, folder tree, Stacking cards / Service card patterns) and AGENTS.md updated. |
| 2026-10-01 | **Hero bands now cover the top of the hero.** Bands are generated from the top-left corner to the bottom edge (before, they started just above the top-right corner, leaving the top-middle and top-left empty), and the fade mask was re-measured from the full-frame screenshot so band strength per region matches the design within ~0.1. |
| 2026-10-01 | **Hero background matched to the Figma screenshot.** Bands are now white sawtooth stripes (78px period, 2.4%) generated from the hero height, so they cover it top to bottom instead of fading out near the top; they sway in step so spacing stays even. Lasers are a single crisp stroke with a white → light cyan → cyan → fade gradient (laser 2 shortened to 180px); a cyan glow only appears near the pointer. Measured against the design: laser colours within a few RGB levels along their length. |
| 2026-10-01 | **Tailwind-first refactor of the Navbar and Hero.** Markup now uses Tailwind utilities, `type-*` styles and color tokens; `header.css` and `hero.css` keep only frame-scale, safe-area, glass and animation rules (mobile-first, `@variant lg`). Added the frame-scale contract (`--spacing: var(--u)`, `--u`-aware text styles), the `glass` and `text-gradient-display` utilities with their tokens, the two-stage Display / 100 curve (min 42px), a 44px touch target on the menu toggle, and lint guardrails (ESLint rule plus `scripts/check-tokens.mjs`). Hero background unchanged. AGENTS.md and DESIGN.md updated. |
| 2026-10-01 | Navbar "Message us" now matches the new Figma screenshot: added the borderless `tint` Button variant and tuned `.nav-cta` to 142×40, 17px icon, 11px gap, 13.5px label. The mobile-menu CTA was switched to `outline` (by the user). |
| 2026-10-01 | Added `MEMORY.md` (this file). |
| 2026-10-01 | Added the `<Button>` component (5 variants, 2 sizes) and the icons `WhatsAppIcon` and `MailIcon`. Restructured components into `ui/`, `icons/`, `layout/` and `sections/`, with colocated CSS. Navbar and hero CTAs now use `<Button>`. Removed the unused `IsoCube` and `CubeIcon`. Added the `--color-deep-teal` token. |
| 2026-10-01 | Added the 1440px `site-container`. Navbar and hero content are wrapped in it, backgrounds stay full-bleed, and the `--u` scale is capped at 1px. |
| 2026-10-01 | Updated AGENTS.md and CLAUDE.md with project and design-system rules. CLAUDE.md imports DESIGN.md. |
| 2026-10-01 | Implemented the design system from the Figma export: `@theme` tokens, `type-*` text styles and the Inter Tight font. Rewrote DESIGN.md as a full guideline. |
| 2026-09-30 | Initial commit: Next.js 16 app with the Navbar and the interactive Hero. |
