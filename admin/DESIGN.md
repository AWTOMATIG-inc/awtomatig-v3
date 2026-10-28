# AWTOMATIG Admin: Design System

The UI guideline for the employee app. It reuses the website's brand and tokens ([frontend/DESIGN.md](../frontend/DESIGN.md)) and adapts them for a dense, work-focused tool. Where this file is silent, the website's rules apply.

> A calm, light, tabular workspace. Charcoal and white do the work; cyan marks the one thing to press or the place you are.

Status: **scaffolded** (tokens, shell, primitives, dashboard; see MEMORY.md). The token block in `app/globals.css` is the source of truth for values. If this file and the code disagree, the code wins; then fix this file.

---

## 1. Principles

1. **Same brand, quieter.** Same palette, fonts, radii, spacing unit and easing as the website. The admin has less atmosphere: no gradients, no glass, no glow, no grain, no animated backgrounds.
2. **Content is the interface.** Tables, forms and numbers are the design. Chrome stays thin so the data has room.
3. **Color means attention.** Most of the screen is neutral. Color appears only for the primary action, the current location and things that need a decision (overdue, low stock, error). Normal and successful states are plain text.
4. **Every element earns its place.** Show a number only if it comes from real data and someone can act on it. A widget that exists to look busy is removed.
5. **Predictable over clever.** The same pattern for the same job on every module: one table, one filter bar, one form layout, one confirmation dialog.
6. **Dense but never cramped.** Row heights and spacing come from the scale in section 4; the page can hold a lot without shrinking text below 12px.

### 1.1 What this UI must never look like

The admin must read as a professional internal tool, not as an AI-generated "mission control" template. These are banned:

- Blinking, pulsing or "live" dots, ping animations, glowing status lights.
- Status banners or footers like "All systems operational", "Healthy", "Online", uptime or latency widgets. (A real operations page, if one is ever built, shows real checks with timestamps, not a mood.)
- Greetings with emoji or motivational text, "Welcome back" hero cards, tips, "Pro" upsells, AI or sparkle buttons, assistant chat bubbles.
- Gradients, glass blur, neon cyan borders or glows, dark "cyberpunk" panels, decorative illustrations or grids, grain.
- Filler visuals: donut or gauge charts with one value, sparklines that are not data, fake trend arrows, random-looking mini charts in every card.
- Animated number counters, looping animations of any kind (a spinner for a pending request is the only exception).
- Colored icon tiles per KPI, rainbow category colors, emoji as icons.
- Placeholder numbers (`XX`, `1,234`) shipped to production. If there is no data, show an empty state.

---

## 2. How it is wired up

| Concern | Where | Notes |
| --- | --- | --- |
| Tokens | `admin/app/globals.css` → `@theme` | A **copy** of the website's token block (no cross-folder imports). Same names, same values. See section 3.4 for the sync rule. |
| Disabled Tailwind defaults | same | Default colors, radii and shadows are cleared, exactly as on the website. Only tokens exist (`rounded-lg` and `text-slate-400` do not). |
| Fonts | `admin/app/layout.tsx` | `next/font/google`: Inter (`--font-inter`) and Inter Tight (`--font-inter-tight`), same variables as the website. |
| Text styles | `@utility type-*` in `globals.css` | The website's `type-*` utilities, minus the display set (section 5). |
| Spacing unit | `--spacing: 1px` | `p-16` = 16px, `p-4` = 4px, as on the website. |
| Components | `admin/components/` | Primitives (Button, Input, Table, Dialog, …) built to this document. |

Because the stack matches the website (Tailwind v4, 1px spacing, `type-*` utilities, semantic color tokens), anyone who has worked on the website can read admin markup without a new vocabulary.

---

## 3. Color

### 3.1 Palette in use

The website's tokens, unchanged. The admin uses a subset:

| Token | Value | Admin use |
| --- | --- | --- |
| `surface-subtle` (Off white) | `#F0F0F0` | The app background behind cards, table header fill, hover and inset fills |
| `surface` (White) | `#FFFFFF` | Cards, tables, forms, dialogs, popovers |
| `surface-inverse` (Charcoal) | `#1E1E1E` | The sidebar, the `dark` button, the strongest chart series |
| `fg-strong` (Black) | `#000000` | Page titles, key figures |
| `fg-primary` (Charcoal) | `#1E1E1E` | Default text |
| `fg-muted` (Black 70%) | `rgb(0 0 0 / 0.7)` | Secondary text, labels, table headers |
| `border` (Gray) | `#D9D9D9` | Every hairline: card borders, dividers, input borders |
| `action-primary` (Cyan) | `#02D5E8` | The primary button, the active nav marker, the focus ring, one highlight series in a chart, selected-row tint (`/12`) |
| `on-action` (Black) | `#000000` | Text and icons on cyan |
| `status-error` (Red) | `#E94738` | Error and overdue markers (dots, borders, icons) |
| `status-caution` (Amber) | `#E8AB02` | Needs-review markers (dots, icons) |
| `status-warning` (Orange) | `#E86D02` | Warnings that are not errors (icons) |

Not used in the admin: `cyan-bright` (except the primary button hover), `cyan-pale`, `deep-teal`, `ink`, all `--gradient-*`, all `--glass-*` and `shadow-glow*`.

### 3.2 Rules

- **Cyan is reserved** for the primary action (one per view), the active nav marker, the focus ring and one emphasised chart series. Text on cyan is black. **Never** put cyan text on white or off-white.
- **Status color is never text.** Red `#E94738` on white is about 3.9:1 and amber is far lower, so neither is allowed for text. Use them for a 6px dot, an icon or a 1px border, and write the state in charcoal text next to it ("Overdue", "Needs review"). Meaning is never carried by color alone.
- **Success and neutral states carry no color.** "Paid", "Shipped" and "Active" are plain text or a neutral chip. This keeps red and amber meaningful.
- If red text is ever needed (an inline field error), add a darker `status-error-text` token (a deep red of about `#B42318` gives roughly 6.5:1 on white; verify before adding) and document it in both DESIGN.md files. Do not inline it.
- Tints use the website's opacity steps only: `/12`, `/20`, `/40`, `/60`.
- No hex literals and no arbitrary `[#…]` values. Same lint rule as the website.

### 3.3 Surfaces

```
App background      surface-subtle   (#F0F0F0)
Card / table / form surface   (#FFFFFF) + 1px border-border, rounded-12, no shadow
Sidebar             surface-inverse  (#1E1E1E)
Popover, menu       surface + border-border + shadow-card
Dialog              surface + shadow-floating over a black/40 scrim
```

Cards are separated from the background by a 1px border and the contrast between `#FFFFFF` and `#F0F0F0`. They have **no shadow**. Shadows mean "this floats above the page" (menus, dialogs) and nothing else.

### 3.4 Keeping tokens in sync with the website

The admin copies the website's `@theme` values rather than importing them. To keep one brand:

- The token block in `admin/app/globals.css` carries a header comment: `Synced from frontend/app/globals.css`.
- A token that exists in both has the same name and value. A change to one is mirrored in the other in the same PR, and both `DESIGN.md` files are updated.
- Admin-only tokens (section 4.2) use the `--admin-*` prefix so they are never confused with a synced one.
- A small script (`scripts/check-tokens-sync.mjs`, to be written with the scaffold) compares the shared names and values and fails `npm run lint` on a mismatch.

---

## 4. Spacing, layout and shape

### 4.1 Spacing

The unit is 1px, and only the website's scale is allowed: `2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 44, 48, 50, 52, 56, 60, 64, 68, 72, 76, 80, 100, 120`. In practice the admin uses `4–32` almost everywhere.

| Use | Value |
| --- | --- |
| Icon ↔ label | 8 |
| Inside controls (horizontal) | 12 |
| Between a label and its field | 6 |
| Between form fields | 20 |
| Card padding | 20 (24 for a card that is a page's main block) |
| Gap between cards in a grid | 20 (the website's grid gutter) |
| Gap between page sections | 24 |
| Page header → content | 24 |

### 4.2 App shell

| Part | Size | Notes |
| --- | --- | --- |
| Sidebar | `--admin-sidebar-w: 240px`; collapsed rail `64px` | Charcoal, full height, fixed from `lg` up. Below `lg` it is a drawer opened from the topbar. |
| Topbar | `56px`, `border-b border-border`, white | Breadcrumb on the left; command search (⌘K) and the user menu on the right. Nothing else. |
| Content area | `surface-subtle`, scrolls | Page padding: `16` below `lg`, `24` at `lg`, `32` at `xl` (1280). |
| Content width | `max-w-site` (1440px), centered in the area | Same cap as the website's container. Wide tables scroll inside their card. |

```
┌──────────┬──────────────────────────────────────────────┐
│ AWTOMATIG│ Dashboard                       ⌘K  Search  ◯ │  56  topbar
│          ├──────────────────────────────────────────────┤
│ Overview │ Dashboard                       [Last 30 days]│
│ • Dash.. │                                               │
│          │ ┌────────┐┌────────┐┌────────┐┌────────┐     │
│ Sales    │ │ KPI    ││ KPI    ││ KPI    ││ KPI    │     │
│   Leads  │ └────────┘└────────┘└────────┘└────────┘     │
│   Quotes │ ┌───────────────────────┐┌────────────────┐  │
│ Finance  │ │ Chart                 ││ Needs attention│  │
│ Inventory│ │                       ││                │  │
│ People   │ └───────────────────────┘└────────────────┘  │
│ Content  │ ┌──────────────────────────────────────────┐ │
│          │ │ Recent activity                          │ │
│ ◯ Name   │ └──────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────┘
   240                   fluid, max 1440
```

**Sidebar details.** Logo (`frontend/public/images/awtomatig-full-logo.png`, white, copied into `admin/public/`) at the top, 24px from the edges. Group labels are `type-caption-12 uppercase text-white/40`. Items are 40px tall, `rounded-8`, `px-12`, with an 18px icon and a `type-body-14` label in `text-white/60`; hover is `text-white` on `bg-white/12`; **active** is `text-white` on `bg-white/12` with a 2px cyan bar on the left edge. The user block sits at the bottom, with the name and role in `type-body-14`; it opens a menu to sign out. No counters or badges on nav items unless they are real, actionable counts.

### 4.3 Radius and shape

Only the website's radii: `rounded-6` for controls (buttons, inputs, badges, tags), `rounded-8` for menu items and sidebar items, `rounded-12` for cards, tables and popovers, `rounded-16` for dialogs, `rounded-full` for avatars. Nested radii shrink inward. No `rounded-34` or `rounded-60` (website expressive shapes).

### 4.4 Breakpoints

The website's: `xs` 360, `sm` 640, `md` 768, **`lg` 1024**, `xl` 1280, `2xl` 1536. Design mobile-first. The full app shell starts at `lg`; below it the sidebar is a drawer and tables scroll horizontally in their card (first column sticky). The admin does **not** use the website's frame scale (`--u`): it is a normal fluid layout.

---

## 5. Typography

Same families: **Inter Tight** (`font-display`) for page and section titles and big figures, **Inter** (`font-sans`) for everything else. Every piece of text uses a `type-*` utility; never hand-combine size, leading and tracking.

The admin uses these website styles only:

| Role | Utility | Notes |
| --- | --- | --- |
| Page title | `type-heading-28` | One per page; `fg-strong` |
| Section / card title | `type-heading-18` | Or `type-heading-20` for a main block |
| KPI figure | `type-heading-40` + `tabular-nums` | Regular weight (`font-normal`), as on the website's stat cards |
| Dialog title | `type-heading-20` | |
| Body, table cells, form values | `type-body-14` | The default text size of the app (not 16) |
| Secondary / helper text | `type-body-14 text-fg-muted` | |
| Table header, KPI label, group label | `type-caption-12 uppercase` | `text-fg-muted` on light, `text-white/40` on the sidebar |
| Buttons | the `Button` label tokens | Same as the website |
| Longer reading text (empty states, descriptions) | `type-body-16` | Rare |

Not used: every `type-display-*`, `type-heading-60/50/34`, `type-numeral`, `type-wordmark` and the gradient text utility. Those are website storytelling.

Rules:

- **Numbers are tabular.** Add `tabular-nums` to every figure, table number column, price and date so digits align. Right-align numeric columns.
- Sentence case everywhere ("Create invoice", not "Create Invoice"). Uppercase is for the caption-style labels above, and for button labels (the `Button` component uppercases them, as on the website).
- Keep text at or above 12px; essential information is at 14px.
- Format: currency with its code or symbol and two decimals, dates as `12 Oct 2026`, times 24-hour, all in the user's locale and timezone.

---

## 6. Shadows, borders and motion

- **Borders:** 1px `border-border`. Inputs, cards and tables all use it. A focused control shows the global cyan `:focus-visible` ring from the base layer (do not remove it).
- **Shadows:** `shadow-card` for menus and popovers, `shadow-floating` for dialogs. Nothing else has a shadow. `shadow-glow*` and `shadow-glass` are not used.
- **Motion:** `ease-out-quint`, **200ms** for color and hover changes, 250ms for a menu or dialog opening (fade plus an 8px translate). No looping animation. A request in progress shows a 16px spinner in the button or a static skeleton (flat `surface-subtle` blocks, no shimmer). Everything respects `prefers-reduced-motion` (`motion-safe:` / `motion-reduce:`).

---

## 7. Components

Build these once in `admin/components/` and reuse them. If a screen needs something new, add it here first.

### 7.1 Button

The website's `Button`, copied, with the same variants and the same rule: **never hand-style a `<button>` or `<a>` as a button.**

| Variant | Use in the admin |
| --- | --- |
| `primary` | The one main action of a view ("Create invoice", "Save"). **One per viewport**, black text on cyan. |
| `outline` | Secondary actions on white ("Export", "Cancel"). The default for toolbar buttons. |
| `dark` | A strong action that is not the main one, and **destructive confirmations** (see below). |
| `light` | Actions on the charcoal sidebar (rare). |
| `tint`, `glass` | Not used. |

Sizes: `md` (40px, the default; forms and toolbars) and a new admin size **`sm` (32px, 13px label, `rounded-6`)** for table row actions and dense toolbars. On touch layouts the hit area extends to 44px with a pseudo-element, as on the website. The admin `Button` (`components/ui/Button.tsx`) has the variants `primary`, `outline`, `dark` and `light` only, and it changes color on hover without the website's lift or glow. Destructive confirmations use the `dark` variant, and the destructive nature is carried by the dialog text and a `status-error` icon, because red text on a red or white button fails contrast (section 3.2).

### 7.2 Form controls

- **Field:** label above (`type-body-14 font-medium`, 6px gap), control, then optional helper (`type-body-14 text-fg-muted`) or error. Required fields mark `*` after the label in `fg-muted`, not red.
- **Input / select / textarea:** 40px tall, `rounded-6`, `bg-surface`, 1px `border-border`, `px-12`, `type-body-14`, placeholder `text-black/40`. Hover darkens the border to `border-black/40`; focus shows the cyan ring. Disabled is `opacity-40` on `bg-surface-subtle`.
- **Error:** the border becomes `border-status-error`, and a `type-body-14` message with a 14px `status-error` alert icon sits under the field (message text in `fg-primary`, see 3.2).
- **Checkbox / radio / switch:** 18px, charcoal when checked (not cyan: cyan stays the primary-action color), cyan focus ring.
- **Form layout:** one column up to 640px wide for short forms; two columns of fields at `lg` for long ones, 20px gap. Related fields are grouped under a `type-heading-18` section title with a hairline above. The primary and cancel buttons sit bottom-right in a sticky footer for long forms. Validate on blur and on submit, and keep the user's input on error.

### 7.3 Table (the core component)

One `DataTable` serves every list.

- A white `rounded-12` card with a 1px border. Inside, an optional toolbar (search, filters, export) with 16px padding, then the table.
- **Header row:** 40px, `bg-surface-subtle`, `type-caption-12 uppercase text-fg-muted`, a sort icon on sortable columns, sticky on scroll.
- **Body rows:** 48px (40px in the compact density), `type-body-14`, a 1px `border-border` hairline between rows, `px-16`. Hover is `bg-surface-subtle`; a selected row is `bg-action-primary/12`. No zebra striping.
- **Cells:** text left, numbers and money right (tabular), dates left. The primary column (name, number) is `font-medium` and is the link to the record. Row actions are an `sm` icon button or a "⋯" menu at the right edge, never a cluster of colored buttons.
- **Footer:** "1–25 of 312" on the left, previous / next on the right. Pagination, sorting and filtering are server-side (root rules). Page size 25 by default.
- **Empty:** one centered line in `type-body-16 text-fg-muted` ("No overdue invoices.") with, if useful, an `outline` button to the next step. No illustrations, no exclamation marks.
- **Loading:** the header plus 8 skeleton rows. **Error:** an inline message with a "Try again" button inside the card.
- Bulk actions appear in the toolbar once rows are selected, replacing the filters, with the count ("3 selected").

### 7.4 Status badge

A neutral chip (`rounded-6`, `bg-surface-subtle`, `type-caption-12`, `px-8 py-2`) with the state in `fg-primary`. Only states that need attention add a **static 6px dot** before the label: red for Overdue, Failed and Rejected; amber for Needs review and Expiring; orange for Warning. Neutral states ("Draft", "Archived") have a gray dot or none. Positive states ("Paid", "Active", "Shipped") have no dot. The dot never animates.

### 7.5 Cards and KPI cards

- **Card:** `bg-surface`, 1px `border-border`, `rounded-12`, `p-20`, a `type-heading-18` title row with an optional `outline` `sm` action on the right. No icon in the title.
- **KPI card:** `type-caption-12 uppercase text-fg-muted` label; the figure in `type-heading-40 font-normal tabular-nums text-fg-strong` 8px below; a single `type-body-14 text-fg-muted` line under it for context ("Awaiting a reply for 2+ days", "vs 84 in the previous 30 days"). The whole card is a link to the filtered list it counts. No icon, no sparkline, no colored background. A money figure uses compact notation (`BDT 1.24M`) so it fits the card; the exact amount is on the list. A trend is shown **only** when a real comparison exists, as plain text with no arrow color ("+12% vs previous 30 days").

### 7.6 Tabs and filters

- **Tabs:** an underline row. 40px tall, `type-body-14`, inactive `text-fg-muted`, active `text-fg-strong font-medium` with a 2px charcoal underline (not cyan, not pills).
- **Filters:** a row of `outline` `md` controls (select or popover) above the table, with an "Clear filters" text button when any are active. Active filters show as removable chips (`rounded-6`, `bg-surface-subtle`, an × icon).
- **Segmented control** (date range, density): a 40px group of two to four options in one bordered `rounded-6` container; the selected option is `bg-surface-inverse text-fg-inverse`.

### 7.7 Dialog, menu, toast

- **Dialog:** `rounded-16`, `surface`, `shadow-floating`, `p-24`, max 520px wide (720px for forms), black/40 scrim, focus trapped, closes on Esc. `type-heading-20` title, body in `type-body-14`/`16`, actions bottom-right: `outline` Cancel, then the action. A destructive confirmation names what will change ("Delete invoice INV-0042? This cannot be undone.") and uses the `dark` button labeled with the verb ("Delete invoice").
- **Menu / popover:** `rounded-12`, 1px border, `shadow-card`, 4px padding, 36px items (`rounded-8`, `type-body-14`, hover `bg-surface-subtle`).
- **Toast:** bottom-right, `rounded-12`, charcoal with white text, `type-body-14`, auto-dismisses in 5s, one line, with an optional undo. Confirm real outcomes only ("Invoice INV-0042 sent"). Errors stay until dismissed.

### 7.8 Icons

Stroke icons on a 24px viewBox, **1.5 stroke**, `currentColor`, shown at 16px (labels and buttons), 18px (nav) or 20px (headings), matching the website's icons. The icon set is `lucide-react`, always with `strokeWidth={1.5}` and `aria-hidden` (decided at scaffold). Icons never sit in colored tiles. Icon-only buttons have an `aria-label`.

### 7.9 Charts

Charts are for decisions, not decoration.

- **Types:** bar and line only (a table, if precision matters). No pie, donut, gauge, radar or 3D.
- **Color:** charcoal for the main series, `border` gray (`#D9D9D9`) for a comparison series, **cyan for the one series or bar that is the point** (for example the current period). Maximum two colors in a chart. No gradients or area fills.
- **Chrome:** horizontal gridlines only, 1px `border-border`; axis labels `type-caption-12 text-fg-muted` (not uppercase); no chart border; bars have `2px` top radius; lines are 2px with no point markers except on hover.
- **Tooltip:** a small `surface` popover (`rounded-8`, `shadow-card`, `type-body-14`) with the exact value and period.
- Always show the unit and the period in the title or subtitle ("Leads per week, last 12 weeks"). Every chart has a table or text alternative for screen readers.

---

## 8. The dashboard

The dashboard is a **worklist and a summary, not a status screen**. Every block answers "what do I need to look at?" and links to the place where the work happens. It shows nothing that is not real data.

### 8.1 Layout (desktop, content area ≤ 1440px)

1. **Page header:** `type-heading-28` "Dashboard" on the left. On the right, a segmented date range (`7 days`, `30 days`, `90 days`; 30 selected). No greeting, no illustration.
2. **KPI row:** four KPI cards in a `grid-cols-4` with a 20px gap (two columns at `md`, one below `sm`). Each is a link to a pre-filtered list. The first release shows only figures the live modules can supply, for example: **Open leads**, **Quotes awaiting reply**, **Overdue invoices** (amount, in the card's figure) and **Items below reorder level**. Hide a card whose module is not built yet.
3. **Main row** (`lg:grid-cols-3`, 20px gap):
   - **Trend chart** (spans 2 columns): one chart, such as *Leads per week* (bars; the current week in cyan), with a segmented switch (Leads / Revenue) only when both exist.
   - **Needs attention** (1 column): a list of up to 6 actionable rows, each "what, who, how long" with a static status dot where relevant, linking to the record ("INV-0042 · Acme Ltd · 14 days overdue", "Lead from the website · no reply for 3 days"). A "View all" text link at the bottom. Empty: "Nothing needs attention."
4. **Recent activity** (full width): a compact `DataTable` of the last 8 entries from the audit log (when, who, what), with a "View all activity" link.

Order, from the top, follows urgency: totals, then trend, then what to do, then history.

### 8.2 Behavior and states

- All figures come from the API. The server returns the comparison period, so a delta is shown only when it can be computed.
- The date range changes the KPIs, the chart and the comparison together, and is kept in the URL (`?range=30d`) so a view can be shared.
- **Loading:** static skeletons in place of each block, with no spinner screen. **Error:** the failing block shows an inline error and a retry, the rest still renders.
- **Empty (new install):** blocks show plain empty text. There is no onboarding carousel.
- Data refreshes on navigation and on a manual "Refresh" `outline` `sm` button next to the date range, not on a timer. The dashboard never auto-updates figures while a person is reading.
- It is fully usable with the keyboard, and every KPI card and list row is a real link.

### 8.3 Other module screens

Every module follows the same skeleton so the app feels like one tool:

- **List page:** page title and one `primary` button (top right) → tabs or filters → `DataTable`.
- **Detail page:** a header with the record's name, its status badge and the main actions; a two-column body (a 2/3 content column of cards, a 1/3 column of meta and related items); an activity card at the bottom from the audit log.
- **Create / edit:** the form layout in 7.2, in a page for long forms and in a dialog for short ones.

---

## 9. Accessibility

- Body text contrast ≥ 4.5:1 and large text ≥ 3:1. The website's approved pairings apply: charcoal or black on white and off-white, white on charcoal, black on cyan, white at 60% on charcoal (secondary text). `text-white/40` on charcoal is for the sidebar group labels only (≈3.7:1, 12px uppercase: acceptable as a decorative label, not as essential information).
- Never rely on color alone: every status has a text label.
- Visible hover, `:focus-visible` (the global cyan ring), disabled and pressed states on everything interactive. Touch targets ≥ 44×44px on touch layouts.
- Keyboard: all tables, menus, dialogs and the command search work without a mouse; dialogs trap and restore focus; a "Skip to content" link is the first focusable element.
- Respect `prefers-reduced-motion`. Text reflows at 200% zoom.
- Semantic structure: one `h1` per page (the page title), landmarks for the sidebar (`nav`), topbar (`header`) and content (`main`), real `<table>` markup with `scope` on headers.

---

## 10. Do / Don't checklist

Check this before opening a PR that touches the admin UI:

- [ ] Colors come from semantic tokens; no hex or arbitrary values; status color is a dot, icon or border, never text.
- [ ] Cyan appears only as the primary action, the active nav marker, the focus ring, a selected-row tint or one chart highlight. One primary button per viewport.
- [ ] Text uses `type-*` utilities from section 5; figures use `tabular-nums`; sentence case.
- [ ] Spacing is on the scale; radius is 6 / 8 / 12 / 16 / full; cards have a border and no shadow.
- [ ] No gradients, glass, glow, blur, grain or looping animation. No blinking dots, no "operational" banners, no filler widgets (section 1.1).
- [ ] Lists use `DataTable`; forms use the shared field layout; confirmations use the shared dialog.
- [ ] Every number on screen comes from real data, and empty, loading and error states exist.
- [ ] Hover, focus-visible, disabled and reduced-motion are handled; keyboard works end to end.
- [ ] Works from 360px to 1536px+ without page-level horizontal scroll (tables scroll inside their card).
- [ ] `npm run lint` and the build pass.

---

## 11. Open items

- [x] ~~Icon set~~: `lucide-react` at 1.5 stroke.
- [x] ~~Chart library~~: Recharts, themed in `components/charts/BarChart.tsx`.
- [ ] Add a `status-error-text` token (deep red) if red text is needed, and verify its contrast.
- [x] ~~Table and form libraries~~: TanStack Table v8 (`DataTable`) and React Hook Form + zod (`Field`, `Input`).
- [ ] Dark theme: not planned. The sidebar is charcoal; the content stays light.
- [ ] Confirm the exact sidebar and topbar sizes and the 40px-vs-48px table row density with the first real screen.
- [x] ~~`scripts/check-tokens-sync.mjs`~~: written and part of `npm run lint`.

## 12. Changing the system

1. Decide in this file first, then change the token or component.
2. If a token is shared with the website, change both `app/globals.css` files and both `DESIGN.md` files in one PR.
3. Prefer a semantic token over a new primitive. Never inline a one-off value.
4. Add the change to `admin/MEMORY.md`.
