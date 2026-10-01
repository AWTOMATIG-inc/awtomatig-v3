<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: AWTOMATIG website

Marketing site for AWTOMATIG, built with Next.js 16 (App Router, Turbopack), React 19, TypeScript and Tailwind CSS v4.

## Commands

- `npm run dev`: start the dev server
- `npm run build`: production build. Run it to verify changes.
- `npm run lint`: ESLint, then `scripts/check-tokens.mjs` (fails on raw color literals in component CSS)

## Structure

- `app/layout.tsx`: root layout. Loads the Inter and Inter Tight fonts through `next/font/google`.
- `app/page.tsx`: home page. It only composes `<Header />` and section components.
- `app/globals.css`: design tokens (`@theme`), `site-container`, text-style utilities (`@utility type-*`), base styles, and the `@import` list of component CSS files
- `app/components/ui/`: reusable primitives (`Button`, …), imported from `@/app/components/ui`
- `app/components/icons/`: SVG icon components, imported from `@/app/components/icons`
- `app/components/layout/`: site chrome shared by all pages (`header/`, later `footer/`)
- `app/components/sections/<page>/<section>/`: page-specific sections, e.g. `sections/home/hero/HeroSection.tsx`
- `public/images/`: logos and static images. Import them with `@/public/...` and render with `next/image`.
- `DESIGN.md`: the design system guideline. §10 covers the folder rules and the Button API.
- `MEMORY.md`: project memory, covering current status, key decisions and why, gotchas, open items and the change log. Read it before starting work, and update it when you make a decision, ship a section or resolve an open item.

Component rules:

- One folder per component or section, with its `.tsx` and `.css` side by side. Folders are kebab-case and components PascalCase. Each section has one `<Name>Section.tsx` entry point.
- Repeated cards are data-driven: one layout component mapped over a content array, with per-item colors in a theme map of full class strings (see `sections/home/services/`). Scroll-stacking cards reuse the `StackingCards` pattern (DESIGN.md §10.4).
- **Tailwind first.** Style in JSX with Tailwind utilities and tokens: layout, spacing, sizing, typography (`type-*`), colors, borders, radius, simple hover/focus/`motion-reduce:` states and responsive variants. A component `.css` file is only for what utilities can't express cleanly: the `--u` frame scale and other custom properties, `env(safe-area-*)` math, pseudo-element layers, multi-layer gradients/filters, keyframes and multi-property state transitions. See DESIGN.md §10.1.
- Component CSS goes in `@layer components { … }` and must be registered with an `@import` at the top of `app/globals.css` (`ui/` first, then `layout/`, then `sections/`). Write it mobile-first and use `@variant lg { … }` for breakpoints.
- **Always use `<Button>`** for buttons and button-styled links. Never hand-style a `<button>` or `<a>` as a button. Pick the variant by surface: `primary` (cyan CTA, one per viewport), `glass` (bordered, on dark), `tint` (borderless dark tint, on dark or glass, e.g. the navbar CTA), `dark` (on cyan or light), `light` (white, on dark or off-white), `outline` (on light). Sizes are `md` (40px) and `lg` (54px). Pass `className` for layout only.

## Design system (mandatory for all UI work)

All UI must follow **[DESIGN.md](DESIGN.md)**. Read it before building or changing any UI. Tokens are defined in `app/globals.css`. If DESIGN.md and the code disagree, the code wins; then update DESIGN.md.

Rules that are easy to get wrong:

1. **Tailwind defaults are disabled.** Default colors, radii and shadows are cleared, so `text-slate-400`, `rounded-lg`, `shadow-md` and similar classes do not exist. Use only design tokens.
2. **The spacing unit is 1px.** `p-16` = 16px and `p-4` = **4px** (not 16px). Use only the spacing scale: `6, 8, 10, 12, 16, 20, 32, 40, 50, 60`. The one exception is the desktop composition of a frame-scaled section (header, hero), where Figma px are used verbatim (`gap-36`, `w-250`) because they scale with `--u`.
3. **Colors:** prefer the semantic tokens (`text-fg-primary`, `text-fg-strong`, `text-fg-inverse`, `bg-surface`, `bg-surface-subtle`, `bg-surface-inverse`, `bg-action-primary`, `text-on-action`, `border-border`). For tints, use the opacity steps `/12`, `/20`, `/40`, `/60` (e.g. `text-white/60`). No hex literals and no arbitrary `[#…]` values in new code.
4. **Cyan is reserved** for the primary action, brand accents and active/hover states. Text on cyan is always black. Never put cyan text on a white or off-white background. Use at most one cyan primary CTA per viewport.
5. **Typography:** every piece of text uses a `type-*` utility (`type-display-100`, `type-heading-40`, `type-body-16`, `type-label-14`, …). Never hand-combine size, leading and tracking, and never re-declare a style's size in component CSS. Display and headings use Inter Tight (`font-display`); body and labels use Inter (`font-sans`).
6. **Radius:** `rounded-6 | 8 | 12 | 16 | 34 | 90`, plus `rounded-full`. **Shadows:** `shadow-card`, `shadow-floating`, `shadow-glow`, `shadow-glow-strong`.
7. **Motion:** use `ease-out-expo` or `ease-out-quint`, 200–450ms. Always respect `prefers-reduced-motion`.
8. **Accessibility:** keep the global `:focus-visible` ring, make touch targets at least 44×44px, meet WCAG AA contrast (see DESIGN.md §11), and use semantic heading order.
9. **Layout and the site container:** the max container width is **1440px**. The content of the navbar, the hero and **every new section** must sit inside a `site-container` element, which caps width at 1440px, centers it and adds gutters (60px at ≥1024px, 24px below, safe-area aware). Background colors, gradients, images and effects stay on the **full-width** section element *outside* the container, so they bleed edge to edge. Pattern: `<section className="bg-…"><div className="site-container">…</div></section>`. For Figma-specific side padding, set `--gutter-start` / `--gutter-end` in the section CSS rather than adding `px-*`. Never nest containers. Design mobile-first; the desktop layout starts at `lg` (1024px). See DESIGN.md §9.
10. **Frame scale:** a pixel-locked section (only the header and hero today) sets `--u: clamp(…, 100vw / 1440, 1px)` and `--spacing: var(--u)` from `lg` up in its CSS. Every Tailwind spacing/sizing utility, the fixed `type-*` styles and `<Button>` then scale with the 1440 frame, so its markup is still plain Tailwind. Don't use the frame scale for ordinary sections. See DESIGN.md §9.2.
11. **New tokens:** if a value is genuinely missing, add a token to `@theme` in `app/globals.css` and document it in DESIGN.md. Do not inline one-off values.

## Code conventions

- Server Components by default. Add `"use client"` only for interactivity (state, effects, browser APIs).
- Use `next/image` for images and `next/font` for fonts. Never load fonts from a `<link>`.
- Component CSS classes are named by component (`.nav-pill`, `.hero-inner`) and reference token variables only (`var(--color-cyan)`, `var(--radius-12)`, `var(--ease-out-quint)`). Raw color literals are allowed only in `@theme`; a deliberate exception (the hero's atmospheric background) is wrapped in `/* token-check: off */ … /* token-check: on */`.
- Reusable effects are utilities in `globals.css`: `glass` (frosted glass surface) and `text-gradient-display` (Display title gradient).
- Keep comments brief and only where intent isn't obvious, matching the existing code.
- Before finishing UI work, run `npm run build` and `npm run lint`, then go through the checklist in DESIGN.md §12.
