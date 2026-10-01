# AWTOMATIG Design System

> A focused monochrome foundation, with cyan reserved for brand energy and primary actions.

This document is the reference for building UI in this project. It covers the design tokens taken from Figma, how they map to code, and the rules every page and component must follow.

**Source of truth:** tokens live in [`app/globals.css`](app/globals.css), in the `@theme` block and the `@utility type-*` blocks. If this document and the code disagree, the code wins. Then fix this document.

---

## Contents

1. [Principles](#1-principles)
2. [How it is wired up](#2-how-it-is-wired-up)
3. [Color](#3-color)
4. [Typography](#4-typography)
5. [Spacing](#5-spacing)
6. [Radius](#6-radius)
7. [Effects: shadow & opacity](#7-effects-shadow--opacity)
8. [Motion](#8-motion)
9. [Layout & breakpoints](#9-layout--breakpoints)
10. [Components](#10-components)
11. [Accessibility rules](#11-accessibility-rules)
12. [Do / Don't checklist](#12-do--dont-checklist)
13. [Changing the system](#13-changing-the-system)
14. [Open items to verify in Figma](#14-open-items-to-verify-in-figma)

---

## 1. Principles

1. **Monochrome first.** Layouts are built from black, charcoal, off-white and white. Most of any screen should be neutral.
2. **Cyan is a signal, not decoration.** Use cyan for the brand moment, the primary action, and active or hover states. If everything is cyan, nothing stands out.
3. **Compact editorial headlines, readable body copy.** Inter Tight sets display and heading type with tight tracking. Inter sets body and interface copy.
4. **Rhythm comes from scales.** Tight 6–16px gaps inside components, generous 20–60px rhythm between sections.
5. **Depth is intentional.** Shadows and transparency express hierarchy, such as a floating card or a glass navigation bar. They are never ornament.
6. **Roles before values.** Reach for semantic tokens (`fg-*`, `surface-*`, `action-*`) before raw primitives, so intent survives theme or brand changes.

---

## 2. How it is wired up

| Concern | Where | Notes |
| --- | --- | --- |
| Color, spacing, radius, shadow, easing tokens | `app/globals.css` → `@theme { … }` | Tailwind v4 generates the utilities from these, e.g. `bg-surface-inverse`, `rounded-12`, `shadow-card`. |
| Font families | `app/globals.css` → `@theme inline { … }` | `font-sans` = Inter, `font-display` = Inter Tight. |
| Font loading | `app/layout.tsx` | `next/font/google` self-hosts Inter (`--font-inter`) and Inter Tight (`--font-inter-tight`) and puts both variables on `<html>`. |
| Text styles | `app/globals.css` → `@utility type-*` | One utility per Figma text style, e.g. `type-heading-40`. |
| Content container | `app/globals.css` → `@utility site-container` | 1440px max-width wrapper for every section's content (see §9). |
| Effect utilities | `app/globals.css` → `@utility glass`, `@utility text-gradient-display` | Frosted glass surface (§7.3) and the Display title gradient (§4.3). |
| Component styles | `app/components/**/<name>.css`, `@import`ed at the top of `globals.css` | Colocated with each component (see §10.1). |
| Base styles | `app/globals.css` → `@layer base` | Body defaults to `surface-inverse` with `fg-inverse` text. `h1`–`h6` use Inter Tight. Focus ring uses `action-primary`. |

**Tailwind's default palette, radii and shadows are disabled** (`--color-*: initial`, etc.). Classes like `text-slate-400`, `rounded-lg` and `shadow-md` do not exist in this project. This is deliberate: only design-system values are available.

In plain CSS (inside `@layer components`), use the same tokens as CSS variables, e.g. `var(--color-cyan)`, `var(--radius-12)`, `var(--shadow-card)`.

---

## 3. Color

### 3.1 Primitive palette

Raw values sampled from the homepage's repeated fills and strokes. Use cyan sparingly, against white, off-white or charcoal surfaces.

| Token | Hex | Tailwind | CSS variable |
| --- | --- | --- | --- |
| Black | `#000000` | `bg-black`, `text-black` | `--color-black` |
| Charcoal | `#1E1E1E` | `bg-charcoal` | `--color-charcoal` |
| Off white | `#F0F0F0` | `bg-off-white` | `--color-off-white` |
| White | `#FFFFFF` | `bg-white` | `--color-white` |
| Gray | `#D9D9D9` | `bg-gray`, `border-gray` | `--color-gray` |
| Cyan | `#02D5E8` | `bg-cyan` | `--color-cyan` |
| Bright cyan | `#00EAFF` | `bg-cyan-bright` | `--color-cyan-bright` |
| Warning | `#E86D02` | `text-warning` | `--color-warning` |
| Deep teal | `#002022` | (CSS only) | `--color-deep-teal`: tint for glass surfaces on dark (glass button). Always use it with transparency. |
| Ink | `#111111` | `bg-ink` | `--color-ink`: the deepest dark surface, under charcoal panels (Ad Tech service card). Prefer `surface-deep`. |

`transparent` and `current` (currentColor) are also available.

### 3.2 Semantic roles (use these by default)

| Role | Maps to | Tailwind | Use for |
| --- | --- | --- | --- |
| `fg-primary` | Charcoal | `text-fg-primary` | Default text on light surfaces |
| `fg-strong` | Black | `text-fg-strong` | Headlines and emphasis on light surfaces |
| `fg-inverse` | White | `text-fg-inverse` | Text on charcoal, black or imagery |
| `surface` | White | `bg-surface` | Default light page or card background |
| `surface-subtle` | Off white | `bg-surface-subtle` | Alternating sections, inset panels, inputs |
| `surface-inverse` | Charcoal | `bg-surface-inverse` | Dark sections (hero, footer), dark cards |
| `surface-deep` | Ink | `bg-surface-deep` | A dark section that holds charcoal panels, so the panel still reads as raised |
| `action-primary` | Cyan | `bg-action-primary` | Primary buttons, links, active states |
| `action-primary-bright` | Bright cyan | `hover:bg-action-primary-bright` | Hover or pressed state of primary actions |
| `on-action` | Black | `text-on-action` | Text and icons placed on cyan |
| `border` | Gray | `border-border` | Hairlines and dividers on light surfaces |
| `status-warning` | Warning | `text-status-warning` | Warnings and caution states only |

### 3.3 Color rules

- **Text on cyan is always black** (`text-on-action`). White on cyan fails contrast (≈1.8:1).
- **Never use cyan for body text on white or off-white.** It fails contrast. On light surfaces, cyan may only fill buttons, icons or decorative accents.
- Cyan text **is** allowed on charcoal or black (≈9:1).
- `gray` is for borders, dividers and placeholder blocks, never for text on white.
- `warning` is for status only, not branding. On white, use it only for large text (≥24px) or icons (≈3.1:1).
- Limit each viewport to **one** cyan primary action. Secondary actions are neutral (ghost or outline).
- For lighter or darker variants, apply an opacity modifier (see [§7.2](#72-opacity)) to an existing token. Do not invent a new hex. Example: muted text on dark = `text-white/60`.
- No arbitrary color values (`bg-[#123456]`) in new code. If a color is genuinely missing, add a token (see [§13](#13-changing-the-system)).

---

## 4. Typography

### 4.1 Families

| Family | Tailwind | Role |
| --- | --- | --- |
| **Inter Tight** | `font-display` | Display and Heading styles: compact editorial impact |
| **Inter** | `font-sans` (default) | Body and Label styles: long-form and interface copy |

### 4.2 Type scale

Each Figma text style has a matching `type-*` utility that sets the family, size, line height, tracking and weight together. Sizes are the values in the 1440px design frame. Styles of 28px and larger scale down fluidly on smaller screens (`clamp`), so they never need manual breakpoints. Display / 100 uses a two-stage curve: `10vw` between 42px and 72px below `lg`, then it tracks the 1440 frame (72 → 100px) from `lg` up, with no jump at the breakpoint.

The fixed sizes (24px and below) are written as `calc(var(--u, 0.0625rem) * N)`. Outside a frame-scaled section that is plain `rem` (it respects the user's font-size setting); inside the header or hero on desktop it follows the `--u` frame scale (§9.2), so the same `type-*` class works in both places.

| Figma style | Utility | Family | Size (desktop → min) | Line height | Tracking | Weight |
| --- | --- | --- | --- | --- | --- | --- |
| Display / 100 | `type-display-100` | Inter Tight | 100 → 42px | 0.99 | -0.04em | 500 |
| Display / 80 | `type-display-80` | Inter Tight | 80 → 40px | 1.00 | -0.04em | 500 |
| Heading / 60 | `type-heading-60` | Inter Tight | 60 → 36px | 1.05 | -0.03em | 500 |
| Heading / 50 | `type-heading-50` | Inter Tight | 50 → 32px | 1.10 | -0.03em | 500 |
| Heading / 40 | `type-heading-40` | Inter Tight | 40 → 28px | 1.10 | -0.02em | 500 |
| Heading / 34 | `type-heading-34` | Inter Tight | 34 → 26px | 1.15 | -0.02em | 500 |
| Heading / 28 | `type-heading-28` | Inter Tight | 28 → 24px | 1.20 | -0.015em | 500 |
| Heading / 24 | `type-heading-24` | Inter Tight | 24px | 1.25 | -0.01em | 500 |
| Heading / 20 | `type-heading-20` | Inter Tight | 20px | 1.30 | -0.01em | 500 |
| Heading / 18 | `type-heading-18` | Inter Tight | 18px | 1.30 | -0.01em | 500 |
| Body / 20 | `type-body-20` | Inter | 20px | 1.50 | 0 | 400 |
| Body / 16 | `type-body-16` | Inter | 16px | 1.60 | 0 | 400 |
| Body / 16 Compact | `type-body-16-compact` | Inter | 16px | 1.40 | 0 | 400 |
| Body / 14 | `type-body-14` | Inter | 14px | 1.50 | 0 | 400 |
| Label / 16 Upper | `type-label-16-upper` | Inter | 16px | 1.20 | 0.01em | 600, UPPERCASE |
| Label / 16 | `type-label-16` | Inter | 16px | 1.20 | 0 | 600 |
| Label / 14 | `type-label-14` | Inter | 14px | 1.20 | 0 | 600 |

The specimen text from Figma shows how each group is meant to be used: Display ("Automation, amplified."), Heading ("Build what matters."), Body ("Clear systems create momentum."), Label ("EXPLORE SOLUTIONS").

```tsx
<h1 className="type-display-100 text-fg-inverse">Automation, amplified.</h1>
<h2 className="type-heading-40 text-fg-strong">Build what matters.</h2>
<p className="type-body-16 text-fg-primary">Clear systems create momentum.</p>
<a className="type-label-14 uppercase">Explore solutions</a>
```

### 4.3 Typography rules

- **Always use a `type-*` utility** for text. Do not hand-combine `text-[42px] leading-[1.1] tracking-tight`.
- Pick the style by **role, not by eye**:
  - **Display**: at most one per page, in the hero or a major statement.
  - **Heading 60–40**: section titles. **34–24**: sub-sections and card titles. **20–18**: small titles and emphasized lines.
  - **Body 20**: lead or intro paragraphs. **Body 16**: default paragraphs. **16 Compact**: dense UI and cards. **14**: captions, meta and footnotes.
  - **Label**: buttons, navigation, tags, eyebrows. Uppercase labels are for CTAs and eyebrows only.
- Semantic HTML is independent of visual style: an `<h2>` may use `type-heading-28`. Keep the heading order (`h1` → `h2` → `h3`) correct regardless of size.
- Keep paragraphs to **~60–75 characters** per line (`max-w-720` for Body 20, `max-w-640` for Body 16; max-width utilities use the 1px spacing unit).
- Display gradients (white → pale cyan, as in the hero title) are allowed on Display styles only: `type-display-100 text-gradient-display`. The gradient lives in the `--gradient-display` token.
- Responsive type changes the style, not the size: `type-body-16 lg:type-body-20`.
- You may override weight or color after a `type-*` utility (e.g. `type-body-16 font-medium`). Do not override size or line height. If you need to, use another style.

---

## 5. Spacing

**Tailwind's spacing unit is set to 1px** (`--spacing: 1px`). Every spacing utility therefore reads in Figma pixels: `p-16` = 16px, `gap-6` = 6px, `mt-60` = 60px.

> This differs from stock Tailwind, where `p-4` means 16px. In this project `p-4` means **4px**.

### 5.1 Scale

| Group | Values (px) | Use for |
| --- | --- | --- |
| **Component (tight)** | `6`, `8`, `10`, `12`, `16` | Icon ↔ label gaps, padding inside controls, gaps between list items |
| **Group** | `20`, `32`, `40` | Card padding, gaps between related blocks, form rows |
| **Section** | `50`, `60` | Vertical rhythm between sections, page gutters on desktop |
| *Observed only* | `7`, `21`, `25`, `29`, `46`, `52` | Present in the Figma homepage. Use only to match an existing frame exactly; do not use in new work. |
| *Frame-scaled* | any Figma px | Only in the desktop composition of a frame-scaled section (header, hero; §9.2), where values are copied verbatim from Figma (`gap-36`, `w-250`, `h-102`) because they scale with the frame. Mobile layouts of those sections still use the scale. |

### 5.2 Spacing rules

- Use only values from the scale. `p-13` and `mt-[37px]` are not allowed.
- Spacing between elements grows with their conceptual distance: related items close (6–16), groups apart (20–40), sections far (50–60+).
- Prefer `gap-*` on flex or grid parents over margins on children.
- Section vertical padding: **60px+** on desktop and **40px** on mobile.

---

## 6. Radius

| Token | Tailwind | Use for |
| --- | --- | --- |
| `radius/6` | `rounded-6` | Small controls: buttons, inputs, tags, nav CTA |
| `radius/8` | `rounded-8` | Menu items, small cards, dropdowns |
| `radius/12` | `rounded-12` | Standard cards, popovers, mobile menu |
| `radius/16` | `rounded-16` | Large cards, media frames |
| `radius/34` | `rounded-34` | Expressive panels: hero mockups, feature showcases |
| `radius/90` | `rounded-90` | Pills and capsules (badges, chips, pill buttons) |

`rounded-none` and `rounded-full` (perfect circles: avatars, icon buttons) are also available.

**Rules:** nested radii shrink inward (inner radius = outer radius − padding). Don't mix pill and square controls in the same group.

---

## 7. Effects: shadow & opacity

### 7.1 Shadows

| Token | Tailwind | Use for |
| --- | --- | --- |
| Card / Soft | `shadow-card` | Interactive cards and dropdowns; soft lift on hover |
| Floating / Ambient | `shadow-floating` | Prominent floating product imagery or mockups only |
| Glow | `shadow-glow` | Resting state of the cyan primary button on dark surfaces |
| Glow strong | `shadow-glow-strong` | Hover state of the cyan primary button |

**Rules:** use shadows for intentional depth, not decoration. Use at most one `shadow-floating` element per viewport. Glows belong only to cyan elements on dark surfaces.

### 7.2 Opacity

Transparency values repeat across borders, overlays and inverse text. Always pair them with a semantic color through Tailwind's `/` modifier.

| Value | Example | Use for |
| --- | --- | --- |
| **12%** | `border-white/12`, `bg-black/12` | Hairline borders and dividers on dark; subtle hover fills |
| **20%** | `border-white/20`, `bg-black/20` | Glass borders, stronger dividers, pressed fills |
| **40%** | `text-white/40`, `bg-black/40` | Disabled text on dark, image scrims and overlays |
| **60%** | `text-white/60` | Secondary or muted text on dark surfaces |

Don't use other alpha steps in new work. Text below 60% opacity is decorative only and must not carry essential information.

### 7.3 Glass material

Frosted glass on dark is one reusable material, applied with the `glass` utility. Its values are tokens in `@theme`, so component CSS never repeats them.

| Token | Value | Role |
| --- | --- | --- |
| `--glass-fill` | Subtle top/bottom highlights over `rgb(16 24 26 / 0.45)` | Default fill (navbar pill) |
| `--glass-fill-dense` | `rgb(18 26 28 / 0.82)` | Panels over content (mobile menu) |
| `--glass-border` / `-top` / `-bottom` | White at 20% / 34% / 15% | Bevelled 1px hairline |
| `--glass-blur` | `blur(14px) saturate(140%)` | Backdrop filter |
| `--shadow-glass` (`shadow-glass`) | `0 10px 30px -10px`, black 45% | Lift under the glass |

```tsx
<div className="glass rounded-12 p-8">…</div>
```

To swap the fill, set `--glass-bg` on the element (e.g. `--glass-bg: var(--glass-fill-dense)`). Inside component CSS, use `@apply glass;` (see `.nav-pill::before`).

---

## 8. Motion

| Token | Tailwind | Use for |
| --- | --- | --- |
| `--ease-out-expo` `cubic-bezier(0.16, 1, 0.3, 1)` | `ease-out-expo` | Buttons and hover lifts |
| `--ease-out-quint` `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-out-quint` | Navigation, menus and panels opening |

- Durations: **200ms** for color and hover changes, **250–450ms** for movement and reveals.
- Hover lift is at most `-translate-y-1` (1px) together with a shadow change.
- Every animation must respect `prefers-reduced-motion: reduce`: disable transitions, transforms and canvas effects there (use `motion-safe:` / `motion-reduce:` variants).

---

## 9. Layout & breakpoints

### 9.1 The site container (mandatory)

- **Max container width: 1440px**, the Figma frame width (`--container-site`, `max-w-site`). On wider screens the content stays 1440px wide and centered.
- **Every section's content goes inside `site-container`.** This includes the navbar, the hero and every future section.
- **Backgrounds never go inside the container.** Background colors, gradients, images, video, canvas effects, glows and noise all sit on the full-width section element, so they still bleed to the screen edges on ultra-wide displays.

```tsx
{/* Full-bleed section: background, image or effect layers live here */}
<section className="relative bg-surface-subtle">
  <div aria-hidden className="absolute inset-0 …">{/* bg image / effect */}</div>

  {/* Content: capped at 1440px, centered, with gutters */}
  <div className="site-container relative py-60">
    <h2 className="type-heading-50">…</h2>
  </div>
</section>
```

Current usage: the navbar wraps `.nav-pill` in a `site-container` inside the full-width fixed `<header>`. The hero's background (gradient, glow, noise, canvas) stays on `.hero`, and `.hero-inner` is the `site-container`.

| Rule | Detail |
| --- | --- |
| Gutters (side padding) | Built into `site-container`: **60px** at ≥1024px and **24px** below, through `--site-gutter`. Safe-area insets (`env(safe-area-inset-*)`) are included automatically. |
| Per-section gutters | When a Figma frame uses different side padding, set `--gutter-start` / `--gutter-end` on the container element in that section's CSS (the navbar uses 49/60, the hero 72/60, mobile nav 16). Don't add `px-*` to the container. |
| Don't nest | Never put a `site-container` inside another one. |
| Never cap the section | Don't put `max-w-*` or `site-container` on the element that carries a background. |
| Fixed elements | A fixed or sticky bar (like the header) is full-width; its inner content uses `site-container`. |

### 9.2 Breakpoints & scaling

- **Breakpoints** (Tailwind defaults): `sm` 640 · `md` 768 · **`lg` 1024 (desktop layout starts here)** · `xl` 1280 · `2xl` 1536. Design mobile-first, and switch to the desktop composition at `lg:`.
- **Frame scale.** A pixel-locked composition (only `.site-header` and `.hero-inner` today) scales its desktop layout with the 1440 frame. Its CSS sets, from `lg` up:

  ```css
  .hero-inner {
    @variant lg {
      --u: clamp(0.72px, 100cqw / 1440, 1px); /* one Figma px; capped at 1px */
      --spacing: var(--u);                    /* Tailwind spacing/sizing utilities now scale too */
    }
  }
  ```

  Because Tailwind's spacing utilities compile to `calc(var(--spacing) * N)`, the markup stays plain Tailwind (`gap-36`, `w-250`, `lg:h-60`), and the fixed `type-*` styles and `<Button>` follow `--u` too. Below `lg`, `--u` is unset, so 1 unit = 1px. `--u` is **capped at 1px**, so content stops growing at 1440px, in line with the container. Use the frame scale only for pixel-locked hero-style art; ordinary sections use the normal scale and fluid `type-*` styles.

---

## 10. Components

### 10.1 Folder structure

```
app/
├── globals.css                      # tokens, type-* utilities, base styles; @imports every component CSS file
├── layout.tsx                       # fonts + <html>/<body>
├── page.tsx                         # Home: composes layout + home sections only
└── components/
    ├── ui/                          # reusable primitives, no page knowledge
    │   ├── index.ts                 # barrel: import { Button } from "@/app/components/ui"
    │   └── button/
    │       ├── Button.tsx
    │       └── button.css
    ├── icons/                       # SVG icon components
    │   ├── index.ts                 # import { WhatsAppIcon, MailIcon } from "@/app/components/icons"
    │   ├── MailIcon.tsx
    │   └── WhatsAppIcon.tsx
    ├── layout/                      # site chrome shared by every page
    │   └── header/
    │       ├── Header.tsx
    │       └── header.css
    └── sections/                    # page-specific sections, grouped by page
        └── home/
            ├── hero/
            │   ├── HeroSection.tsx  # the section entry point used by page.tsx
            │   ├── InteractiveHero.tsx
            │   ├── HeroContent.tsx
            │   └── hero.css
            └── services/
                ├── ServicesSection.tsx
                ├── ServiceCard.tsx      # one card layout, rendered per item
                ├── StackingCards.tsx    # client: sticky stack offsets + cover progress
                ├── services.ts          # content + per-surface themes
                └── services.css
```

Rules:

- **Where does it go?** Used on several pages and knows nothing about the page → `ui/`. Site chrome (header, footer) → `layout/`. Belongs to one page → `sections/<page>/<section>/`. An SVG → `icons/`.
- **One folder per component or section.** The `.tsx` and its `.css` live together. Name the folder in kebab-case (`case-studies/`) and the component in PascalCase (`CaseStudiesSection.tsx`).
- **Each section exposes one `<Name>Section.tsx`** entry point. Pages only compose sections: `page.tsx` should contain no markup beyond `<Header />`, `<main>` and sections.
- **Tailwind first, CSS for the rest.** Style in JSX with Tailwind utilities and tokens. A component `.css` file holds only what utilities can't express cleanly:

  | Tailwind in JSX | Component CSS |
  | --- | --- |
  | Layout (flex, grid, position, z-index) | Frame-scale and other custom properties (`--u`, `--spacing`, `--gutter-*`) |
  | Spacing and sizing (`gap-12`, `pt-40`, `size-48`) | `env(safe-area-inset-*)` math |
  | Typography (`type-*`, `uppercase`) | Pseudo-element layers (`::before` glass) |
  | Colors, borders, radius, opacity (`text-white/60`, `border-white/12`) | Multi-layer gradients, filters, keyframes |
  | Simple states (`hover:`, `aria-[current=page]:`, `group-data-open:`, `motion-reduce:`) | Multi-property state transitions (menu open/close with a `visibility` delay) |
  | Responsive variants (`lg:`, `max-lg:hidden`) | Tuning a primitive for one placement (`.nav-cta`) |

- **Component CSS** goes in `@layer components { … }` in its own file. Register it with an `@import` at the top of `app/globals.css`, with `ui/` first so sections can override primitives. Write it mobile-first with `@variant lg { … }`, and use token variables only. Raw color literals fail `npm run lint` (`scripts/check-tokens.mjs`); the hero's atmospheric background is the one marked exception (`/* token-check: off */`).
- **Repeated cards are data-driven.** Write the layout once (`ServiceCard.tsx`) and map over an array of content (`services.ts`). Per-item surface colors go in a theme map of full class strings, so Tailwind can detect them.
- A section shared by two pages moves up to `sections/shared/<section>/`.
- Import primitives and icons through their barrels (`@/app/components/ui`, `@/app/components/icons`).

### 10.2 Button

`import { Button } from "@/app/components/ui";` (source: `app/components/ui/button/`).

There are six variants, taken from the Figma button set. Pick the variant by the **surface it sits on**:

| Variant | Look | Use on | Typical use |
| --- | --- | --- | --- |
| `primary` | Cyan fill, black label | Any surface | The one main CTA per viewport ("Explore our services") |
| `glass` | Translucent deep-teal gradient, `white/12` hairline, white label | Dark surfaces | Secondary CTA next to a primary on dark ("Start a conversation") |
| `tint` | Borderless dark tint (black 25% → 35% → 30%) over whatever is behind it, white label | Dark or glass surfaces | Navbar "Message us" (tuned in `header.css` to 142×40, 17px icon, 11px gap, 13.5px label) |
| `dark` | Charcoal fill, white label | Cyan, white, off-white | Primary-strength action on a cyan band or light section |
| `light` | White fill, black label, no border | Dark or off-white | Strong action on dark sections; secondary on off-white |
| `outline` | Transparent, gray (`border`) 1px border, black label | White / off-white | Tertiary actions ("Email us") |

| Size | Height | Label | Icon | Use for |
| --- | --- | --- | --- | --- |
| `md` (default) | 40px | 13px | 16px | Navbar, inline, cards |
| `lg` | 54px (50px below 1024px) | 15px (13px below 1024px) | 18px | Hero and section CTAs, mobile menu |

All variants share: radius `radius/6`, Inter 600 UPPERCASE label, 10px icon gap, and a `-1px` hover lift (except outline). The disabled state is 40% opacity. Inside a section that defines the `--u` frame scale (header, hero), the button scales with it.

Props:

| Prop | Type | Notes |
| --- | --- | --- |
| `variant` | `"primary" \| "glass" \| "tint" \| "dark" \| "light" \| "outline"` | Default `primary` |
| `size` | `"md" \| "lg"` | Default `md` |
| `icon` | `ReactNode` | Leading icon, e.g. `<WhatsAppIcon />` |
| `fullWidth` | `boolean` | Stretches to its container (mobile stacks) |
| `href` | `string` | Renders a link: `next/link` for `/…`, plain `<a>` for `#…`, `mailto:`, `tel:` and external URLs |
| `className` | `string` | **Layout only** (width, margin, flex). Never restyle colors. |
| other props | | Any `<button>` or `<a>` attributes (`onClick`, `disabled`, `type`, `target`, `aria-*`) |

```tsx
<Button variant="primary" size="lg">Explore our services</Button>
<Button variant="glass" size="lg" href="#contact">Start a conversation</Button>
<Button variant="light" fullWidth icon={<WhatsAppIcon />} href="https://wa.me/…">Message us</Button>
<Button variant="outline" fullWidth icon={<MailIcon />} href="mailto:hello@…">Email us</Button>
```

Rules:

- Write labels in normal case in JSX ("Message us"). CSS uppercases them, which keeps screen readers from spelling them out.
- Use `href` for navigation and `onClick` only for in-page actions. Never nest a `<Button>` inside an `<a>`.
- A button that shows only an icon must still have text. Visually hide the label in CSS (see `.nav-cta .btn-label` on narrow screens) or pass `aria-label`.
- Need a new look? Add a variant to `button.css` and `ButtonVariant`, and document it here. Don't override colors at the call site.

### 10.3 Icons

- One component per icon in `components/icons/`, exported from `icons/index.ts`.
- Use `viewBox="0 0 24 24"` and `aria-hidden="true"`, and spread `...props`. The size comes from the parent (e.g. `.btn-icon`).
- UI icons use `currentColor` (stroke 1.5). Brand marks such as WhatsApp keep their brand color. Parts meant to show the surface behind them, like the WhatsApp phone, are cut out with `fillRule="evenodd"`, not filled white.

### 10.4 Other patterns

| Pattern | Spec |
| --- | --- |
| **Glass nav pill** | Transparent at the top of the page; once scrolled or opened, the `glass` material (§7.3) fades in on `.nav-pill::before` (10 Figma px radius, frame-scaled). |
| **Eyebrow / badge** | Brand icon + `type-label-14 uppercase`, 12px gap, above a Display or Heading. |
| **Tag list** | `type-body-16` at `text-white/60`, hover to `text-fg-inverse`, 20–26px gaps. |
| **Divider strip** | `border-y border-white/12` hairlines framing a title and tags row. |
| **Stacking cards** | Full-bleed cards that are `position: sticky` and pile up on scroll (home services). `StackingCards` pins each card once its bottom reaches the viewport bottom (`--stack-top`), so tall cards are read in full, and sets `--stack-progress` (0 → 1) while the next card covers it. The covered card scales to 94% toward the viewport top, rounds to `radius/34` and dims under black at up to 40%. Reduced motion keeps the stacking but drops the scale and dim. |
| **Service card** | Index `NN/` (`type-heading-34`, regular weight, `black/40` or `white/40`) on the last baseline of a `type-heading-60` title; on the right, `type-body-16` copy plus an `lg` button 250px wide. Below that, a points panel (radius/16 top corners, 20px from the frame edge) with a 4-column grid of points (`type-body-16`, 6px dot, 12px gap, hairline under each), then the showcase image at full panel width, flush with the card bottom. Surfaces: white/off-white, cyan/bright cyan (`dark` button), off-white/white, ink/charcoal (`light` button). |

Component rules:

- Every interactive element needs visible **hover**, **focus-visible** and **disabled** states. A global cyan focus ring is provided in the base layer; don't remove it.
- Minimum touch target: **44×44px** on touch layouts. A smaller visual control keeps its size and extends its hit area with a pseudo-element, e.g. `relative size-36 before:absolute before:-inset-4` (the menu toggle).
- Icons inherit `currentColor` and sit at 16px (labels) or 18–20px (headings).
- Name new component classes by component (`.pricing-card`), not by appearance (`.cyan-box`).

---

## 11. Accessibility rules

- Body text contrast must be ≥ **4.5:1**, and large text (≥24px, or ≥18.66px bold) ≥ **3:1**. Approved pairings:

  | Foreground | Background | Ratio | OK for |
  | --- | --- | --- | --- |
  | Charcoal / Black | White, Off white | 15–21:1 | All text |
  | White | Charcoal, Black | 16–21:1 | All text |
  | Black | Cyan | ≈11.6:1 | All text (buttons) |
  | Cyan | Charcoal | ≈9:1 | All text |
  | White 60% | Charcoal | ≈6.5:1 | Secondary text |
  | White 40% | Charcoal | ≈3.7:1 | Large or decorative only |
  | Warning | White | ≈3.1:1 | Large text or icons only |
  | ✗ White | Cyan | ≈1.8:1 | **Never** |
  | ✗ Cyan | White | ≈1.8:1 | **Never for text** |

- Never rely on color alone. Pair state colors with an icon or label.
- Keep `:focus-visible` outlines and support reduced motion (see [§8](#8-motion)).
- Text must reflow at 200% zoom. That is why type sizes use `rem` bounds.

---

## 12. Do / Don't checklist

Check this before opening a PR that touches UI:

- [ ] Colors come from semantic tokens (`fg-*`, `surface-*`, `action-*`), or from primitives with an opacity modifier.
- [ ] No hex or rgb literals and no arbitrary values (`[#…]`, `[13px]`) in new markup or CSS, except inside `@theme`.
- [ ] Styling is Tailwind in JSX; component CSS only holds what §10.1 allows.
- [ ] Every piece of text uses a `type-*` utility. Headings use Inter Tight and body uses Inter.
- [ ] Spacing values are from the scale in §5. Radii are from §6.
- [ ] At most one cyan primary action per viewport, with black text on cyan.
- [ ] Shadows used are `card`, `floating` or `glow`. Opacity steps are 12, 20, 40 or 60.
- [ ] Hover, focus-visible, disabled and reduced-motion states are handled.
- [ ] Section content sits inside `site-container` (max 1440px); backgrounds, images and effects stay full-width outside it.
- [ ] The layout works from 320px to 1440px+ with no horizontal scroll.
- [ ] `npm run lint` passes (ESLint plus the token check).

**Don't:** use Tailwind's default palette (it's disabled), add new grays, put cyan text on light surfaces, stack multiple floating shadows, or use Display styles below the hero.

---

## 13. Changing the system

1. Change or confirm the value in **Figma** first. Figma is the design source.
2. Update the token in `app/globals.css` (`@theme` or the matching `@utility type-*`).
3. Update the matching table in this file.
4. Prefer adding a **semantic** token that points at a primitive over adding a new primitive.
5. Never rename or remove a token without searching for its usages (`grep -r "surface-subtle" app`).

---

## 14. Open items to verify in Figma

The original Figma export listed style **names** but not every value. These were inferred from the built hero section and should be confirmed against Figma, then updated here and in `globals.css`:

- Line height and letter spacing for every text style except Display/100, Heading/18 and Body/20, which were measured from the hero.
- The mapping of `text/primary` (assumed Charcoal) and `text/strong` (assumed Black).
- Exact values of the **Card / Soft** and **Floating / Ambient** shadows.
- Weight and tracking of the Label styles (currently 600, +0.01em for Upper).
- Button label sizes (13px for `md`, 15px for `lg`) don't map exactly to a Label text style (14/16). Confirm whether Figma has a dedicated button text style.
- Hover states for the `dark`, `light` and `outline` buttons. The screenshots showed resting states only, so the hover states are inferred.
- Tag list size: the hero tags were 18px in the build but now follow the Tag list pattern (`type-body-16`). Confirm against Figma whether a Body / 18 style exists.
