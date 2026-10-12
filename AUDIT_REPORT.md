Written for: you and the engineers on this repo. It's a read-only audit and no source files were changed. The only side effect is the `.next/` output from one `next build`.

# AWTOMATIG: Next.js Codebase Audit

**Scope:** every tracked source file, config, asset and the git state. **Verified by running:** `npm run lint` (clean), `tsc --noEmit` (clean), `next build` (all 7 routes prerendered as static `○`).

---

## Executive summary

This is a **real Next.js App Router application, not an SPA running inside Next.js.** Of about 130 source files, only 8 are Client Components, and each has a valid reason (scroll effects, canvas, menu state, form state, filter state). The scroll-driven wrappers take server-rendered content as `children`, which keeps the client boundary as low in the tree as it can go. There is no global state, no client-side data fetching, no unneeded `useEffect`, and no state library. The design system has guardrails that are enforced by lint, which is uncommon and worth keeping.

The problems are mostly **launch readiness and content architecture**, not framework misuse:

1. **The contact form discards every submission but tells the user "we've got your message."**
2. **Most "Start a conversation" CTAs go nowhere.** The Home hero buttons have no `href`, and the shared CTA links to its own anchor.
3. **SEO basics are missing.** The homepage title is still `"Awtomatig - Interactive Hero Section"`, and there is no sitemap, robots file, Open Graph data or `metadataBase`.
4. **The canvas background animates forever** at 60 fps, on two instances per page, including off screen and under reduced motion.
5. **Content is not ready for a CMS.** Copy is JSX with design line breaks (`<br className="max-lg:hidden" />`), and the service taxonomy is defined in 7+ places with inconsistent names.

**Overall: 66 / 100.** The engineering foundation is strong. Launch hygiene and CMS readiness are what pull the score down.

---

## Project architecture overview

```text
awtomatig-v3/
├── app/
│   ├── layout.tsx            root: fonts (next/font), base metadata, viewport
│   ├── page.tsx              Home  ┐
│   ├── about/ services/ process/ case-studies/ contact/  page.tsx  ┘ each composes Header + sections + Footer
│   ├── globals.css           @theme tokens, 30+ @utility, base layer, @imports 3 effect CSS files
│   └── components/
│       ├── ui/               Button, Eyebrow, LinesBackground (client), VideoPlayer (client, unused)
│       ├── icons/            30 SVG components + barrel
│       ├── layout/           header/ (client), footer/
│       └── sections/<page>/<section>/   Section.tsx + colocated data .ts
│           └── shared/       PageHero, IntroSection, CtaSection, FeatureGrid, case-studies data
├── public/images/            ~32 MB of PNG/JPG sources + 5 unused create-next-app SVGs
├── scripts/check-tokens.mjs  lint guard: no stray component CSS, no raw colours
├── AGENTS.md / CLAUDE.md / DESIGN.md (72 KB) / MEMORY.md (79 KB)
└── (no lib/, types/, hooks/, services/, tests/, CI, middleware/proxy, route handlers, env usage)
```

| Directory | Verdict |
|---|---|
| `app/components/ui` | Correct scope. `VideoPlayer` is exported but has no consumer (it was kept deliberately). |
| `app/components/sections/<page>/<section>` | Clear ownership; it scales to about 10 pages. Data files colocated with sections are good now but scatter content once a CMS arrives. |
| `sections/shared/` | Correct promotion rule ("used by 2+ pages"). Holds the case-study **data**, which is domain content rather than a section. |
| `app/components/icons` | Fine. 5 of the 30 icons are used only by the unused `VideoPlayer`. |
| Missing `lib/` or `content/` | Not needed today. It will be needed for a site config and a CMS client (see ADR-2 and ADR-4). |
| `public/*.svg` | **Dead** create-next-app leftovers (`file`, `globe`, `next`, `vercel`, `window`). |

### Current architecture

```text
Build time (next build)                          Browser
───────────────────────                          ───────
Hardcoded .ts data + JSX copy                    Static HTML (7 routes)
        ↓                                         + 8 client islands:
Server Components (sections)          ──────►     Header · LinesBackground ×2/page
        ↓                                         StackingCards · HorizontalScroller
Static HTML + RSC payload (○ all routes)          ProcessTimeline · CaseStudyFilter
                                                  InquiryForm (no submit target)
next/image optimizer (on demand, Vercel)
```

There is no backend, no API, no environment usage in code, and no third-party scripts.

---

## 🔴 Critical findings

### C1: Contact form silently drops leads while confirming success
- **Location:** [InquiryForm.tsx:63-66](app/components/sections/contact/inquiry/InquiryForm.tsx#L63-L66), [:160-162](app/components/sections/contact/inquiry/InquiryForm.tsx#L160-L162)
- **What happens:** `onSubmit` calls `e.preventDefault(); setSent(true)`. Nothing is sent anywhere, yet the user reads *"Thanks, we've got your message and will reply within 1 business day."* It also accepts file uploads that go nowhere.
- **Why it's critical:** the repo is linked to a Vercel project (`.vercel/`). If this page is publicly reachable, every real inquiry is lost, and the customer has been told otherwise. This is the site's main conversion path.
- **Fix now (minimum):** until a backend exists, either hide the form or make submit open a `mailto:` or show "Form coming soon, email hello@…". Do not show a success message.
- **Fix during backend work:** a Server Action with server-side validation, spam protection (honeypot or Turnstile), rate limiting and upload limits.

---

## 🟠 High findings

### H1: The primary CTAs are broken or self-referential
| Where | Problem |
|---|---|
| [HeroContent.tsx:40, 43](app/components/sections/home/hero/HeroContent.tsx#L40) | "Explore Our Services" and "Start a Conversation" have **no `href` and no `onClick`**, so they render as inert `<button>`s. These are the site's most prominent buttons. |
| [CtaSection.tsx:45, 59](app/components/sections/shared/cta/CtaSection.tsx#L45) | The section's `id` defaults to `"contact"` and its primary button defaults to `href="#contact"`, so the button scrolls to itself. This affects Home, Services, About and Process. |
| [PageHero.tsx:38](app/components/sections/shared/hero/PageHero.tsx#L38) | The secondary button goes to `/#contact` (the Home CTA) even though `/contact` now exists. |
| [Footer.tsx:88](app/components/layout/footer/Footer.tsx#L88) | `#contact` does not exist on `/case-studies`, so the button is dead there. |
| `WHATSAPP_URL = "#contact"` in Header, Footer and CtaSection | Placeholder defined three times. |

**Fix now:** point every "Start a conversation" button at `/contact`. This is a few lines.

### H2: SEO foundation missing
- [layout.tsx:20](app/layout.tsx#L20): the Home page inherits `title: "Awtomatig - Interactive Hero Section"`, a leftover.
- No `metadataBase`, no `title.template` (each page hand-writes `"X | AWTOMATIG"`), no Open Graph or Twitter metadata, no `opengraph-image`, no `sitemap.ts`, no `robots.ts`, no canonical URLs, no structured data (`Organization`).
- **Fix now:** set `metadataBase` and `title: { default, template: "%s | AWTOMATIG" }` in the root layout, add `app/sitemap.ts`, `app/robots.ts` and a static `opengraph-image.png`. These are all file conventions in Next 16, so no library is needed.

### H3: The canvas background never stops animating
- **Location:** [LinesBackground.tsx:290](app/components/ui/lines-background/LinesBackground.tsx#L290). `render()` reschedules itself unconditionally. There is no `IntersectionObserver` and no `prefers-reduced-motion` check.
- **Impact:** Home, Services, About and Process each mount **two** instances (hero and CTA). Each clears and redraws 30–60 gradient bands plus a composite mask at device pixel ratio up to 2, at 60 fps, for the whole visit, even when scrolled away. That costs CPU and GPU on laptops and battery on phones, and it competes with the scroll-linked sections. It also breaks the project's own rule in DESIGN §8: *"disable … canvas effects"* under reduced motion.
- **Fix now:** pause the loop when the section is not intersecting the viewport, and under reduced motion draw one static frame. This is about 15 lines and changes nothing visually.

### H4: Placeholder content and missing legal pages on live paths
- "Build the systemssss." typo in the Home hero ([HeroContent.tsx:12](app/components/sections/home/hero/HeroContent.tsx#L12)).
- `XX%` figures on case studies and Contact stats; three copies of the Snaillia case study; `tel:+1234567890` ([inquiry.ts:4](app/components/sections/contact/inquiry/inquiry.ts#L4)).
- `href="#"` for Privacy Policy, Terms, LinkedIn and AWLABS. **The form collects personal data behind a consent checkbox, but no privacy policy exists**, which is a compliance gap (GDPR or similar) as soon as the form works.
- **Fix before launch:** this is a content checklist, not refactoring.

### H5: Service taxonomy and site config are duplicated with inconsistent names (fix before the CMS)
The same four services appear in **at least 7 independent lists** with different spellings:

| Location | Spelling |
|---|---|
| [services.ts](app/components/sections/home/services/services.ts) | `Ad Tech` title, id `ad-tech` |
| [PageHero.tsx:7](app/components/sections/shared/hero/PageHero.tsx#L7) | `AdTech` |
| [caseStudies.ts:6](app/components/sections/shared/case-studies/caseStudies.ts#L6) | `Back-office`, `ERP & Systems`, `AdTech` |
| [inquiry.ts:10](app/components/sections/contact/inquiry/inquiry.ts#L10) | `ADtech`, plus `All` as a help option |
| [Footer.tsx:26-29](app/components/layout/footer/Footer.tsx#L26-L29) | Hardcoded `/#<id>` anchors that must match `services.ts` ids |
| CtaSection `DEFAULT_TAGS`, HeroContent `TAGS` | Tag strings |

Navigation is also duplicated: Header `NAV_LINKS` and the Footer "Pages" column list the same routes in a different order. The contact email appears in Footer and `inquiry.ts`.

**Why it matters:** case-study filtering compares `study.category` strings. Once a CMS supplies categories, every one of these lists drifts.

**Fix before the CMS:** one `services` registry (id, name, short name, slug) and one `site.ts` config (nav, email, WhatsApp, social, legal links). This is config, not CMS content.

---

## Next.js architecture findings

| Topic | Finding |
|---|---|
| Router | App Router only. No `pages/`, no middleware or proxy, no route handlers, no Server Actions. ✅ |
| Rendering | Every route is static (`○`). This is correct for the current content. ✅ |
| Server Components | The default everywhere. Data `.ts` files are imported directly into Server Components. ✅ |
| Layouts | Only the root layout. Each page repeats `<Header /> <main className="flex flex-1 flex-col"> … <Footer />` (6 copies). A `(site)` route-group layout would remove that. The Header could derive `theme` from `usePathname()`, which it already calls, instead of taking a prop. 🟡 |
| `not-found.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx` | None. The 404 page is the unstyled Next default on a charcoal body. `loading` and `error` are irrelevant while everything is static, but they become relevant with CMS fetches. 🟡 |
| Metadata | Static `metadata` per page ✅, but see H2. |
| Caching | No fetches, so nothing to cache. That is correct. **Don't add caching now.** |
| Next 16 deprecations | `priority` on `next/image` is deprecated in v16 ([Header.tsx:172](app/components/layout/header/Header.tsx#L172)); use `preload` or `loading="eager"`. 🔵 |

### Client Component audit (all 8)

| Component | Reason | Valid? | Notes |
|---|---|---|---|
| [Header.tsx](app/components/layout/header/Header.tsx) | Scroll state, menu state, `usePathname`, document listeners | ✅ | Only ~240 lines, so splitting static nav into a server child isn't worth it. `useSyncExternalStore` for scroll is the right tool. |
| [LinesBackground.tsx](app/components/ui/lines-background/LinesBackground.tsx) | Canvas and pointer | ✅ | Hero and CTA content passes through as server `children`. Good. See H3. |
| [StackingCards.tsx](app/components/sections/home/services/StackingCards.tsx) | Scroll measurement | ✅ | The cards stay Server Components (children). Best-practice pattern. |
| [HorizontalScroller.tsx](app/components/sections/home/how-we-work/HorizontalScroller.tsx) | Scroll-linked transform | ✅ | Same pattern. Uses event delegation (`[data-step]`) so the slides stay server-rendered. |
| [ProcessTimeline.tsx](app/components/sections/process/steps/ProcessTimeline.tsx) | Scroll-linked rail | ✅ | Same pattern. `querySelector(...)!` at line 16 throws if a step lacks a node. 🔵 |
| [CaseStudyFilter.tsx](app/components/sections/case-studies/case-study-list/CaseStudyFilter.tsx) | Filter state | ✅ | Pulls `CaseStudyRow`, `CaseStudyDetails`, `Button` and `next/image` into the client bundle. That's fine at 3 rows. With a CMS and many studies, prefer URL-based filtering (`?category=`, shareable and crawlable). Later. |
| [InquiryForm.tsx](app/components/sections/contact/inquiry/InquiryForm.tsx) | Form state | ✅ | The boundary is placed well: the intro and contact list stay on the server. |
| [VideoPlayer.tsx](app/components/ui/video-player/VideoPlayer.tsx) | Media controls | ✅ | **No consumer.** It is exported from the `ui` barrel but never rendered, so it costs nothing at runtime. |

**`"use client"` propagation:** none found. No parent marked client drags a static tree with it, and no page or layout is a client component. **This is the strongest part of the codebase.**

### SPA-pattern check
- **Good React usage:** effects only subscribe to browser events, refs drive animation without re-renders, and attribute toggling (`data-reached`, `data-active`) avoids state churn.
- **Unnecessary React usage:** none found. There are no `useMemo`/`useCallback` without reason (`VideoPlayer` uses `useCallback`, but it is dead code).
- **Next.js anti-patterns:** none. There is no data fetching in effects, no context providers and no client routing logic.

---

## Component architecture, reuse and duplication

**Well done:** `Button` has 6 variants and 5 sizes with discriminated `href` typing, and it renders `next/link` vs `<a>` correctly. `PageHero`, `IntroSection`, `CtaSection` and `FeatureGrid` were each promoted to shared when a second page needed them. Repeated cards follow data plus a theme map (`SERVICE_THEMES`, `STEP_THEMES`). `CaseStudyDetails` is shared by two different card layouts.

| Duplication | Classification | Recommendation |
|---|---|---|
| Service taxonomy and nav/contact config (H5) | **Serious** | Unify before the CMS |
| "Eyebrow + Heading/60 + paragraph on an `Nfr/Nfr` grid" header row (~12 sections, each with different measured fr values) | **Acceptable** | Don't abstract. A `SectionHeader` would need per-instance grid, offset and translate props, which is a worse API than the markup. |
| Home `HeroContent` vs `PageHero` | Acceptable | Different bottom compositions; two consumers. |
| `CtaSection` `LAYOUTS` map (4 near-identical rows of measured offsets) | Acceptable but watch | If a 5th or 6th layout appears, question whether the design genuinely differs per page. |
| `"#contact"` and WhatsApp placeholder in 3 files | Refactor candidate | Into `site.ts` |
| `String(i + 1).padStart(2, "0")` in 5 components | Intentional | Too trivial to extract |

**Abstraction quality:** no premature abstractions, no wrapper-only components, no single-consumer hooks (both custom hooks live inside `Header.tsx`, which is right). `buttonClassName` is exported but has no external consumer. 🔵

---

## Code quality and TypeScript

- **Readability is high.** Comments explain *why* (measurements, browser quirks), names are clear, and files are small (the largest component is 330 lines, the canvas engine).
- **Magic numbers** (`lg:pt-121`, `grid-cols-[349fr_982fr]`, `lg:-translate-y-3`) are everywhere. This is a **documented, deliberate design-fidelity decision** (MEMORY D-entries). The cost: a Figma revision means re-measuring. That's acceptable for a marketing site, so don't change it.
- **Formatting:** there is no Prettier, and it shows in places (odd indentation at [Header.tsx:15, 20](app/components/layout/header/Header.tsx#L15)). Pages use relative `../components` imports while components use `@/` aliases. 🔵
- **TypeScript:** `strict` is on, there is no `any`, and `as const`, `satisfies` and the discriminated Button union are good. Weak spots:
  - Content typed as `ReactNode` (`title`, `description`, `lead`, `Pillar.title`). This is type-safe but **not serializable**, which is the root of the CMS-readiness problem (ADR-3).
  - Non-null assertions (`ctx!`, `section!`) throughout `LinesBackground` inside closures after a guard. These are safe but noisy; capture narrowed locals instead. 🔵
  - `HELP_OPTIONS` and `CASE_STUDY_CATEGORIES` are unrelated `string[]`s, so the type system can't catch the taxonomy drift in H5.

## State management
State is local `useState` in 3 components plus refs and DOM attributes for animation. **No global state is needed now or after the CMS:** server data belongs in Server Components, not client stores. Later, URL state is the right home for the case-study filter. **Do not add Redux, Zustand or React Query.**

## Data fetching
There is no data fetching at all. All content is either colocated `.ts` modules (good: `services.ts`, `steps.ts`, `team.ts`, `caseStudies.ts`) or inline JSX in components and pages (harder: `HeroContent`, `MissionVisionSection`'s `PILLARS`, the props in `services/page.tsx`). The future path `CMS → Server Component → UI` needs no rewrite of the rendering layer; only the content sources change (see Future CMS readiness).

---

## Performance

| Finding | Severity | Detail |
|---|---|---|
| Perpetual canvas loops | 🟠 | H3 |
| Oversized source images | 🟡 | `human_operations.jpg` is **10 MB, 4096×2731** and displays at 935px. `about/member_1.png` is **3.4 MB** and used 3×. `culture.png` is 1.9 MB, plus ~8 PNG photos at 0.8–1 MB. `next/image` serves resized WebP, so users aren't downloading 10 MB, but the first request per size is slow, the transformations count against Vercel image quota, and the repo grows (26 MB of git objects). Re-export photos as JPG or WebP at about 2× display width. |
| `sizes` prop | ✅ | Present on every responsive image. Logos are static imports with intrinsic sizing. |
| LCP | ✅ | Home and page heroes use a text `<h1>` as LCP, with no hero image. |
| Client JS | ✅ | About 615 KB raw across all chunks, mostly the React and Next runtime; app islands are small. No third-party runtime dependencies (only `next`, `react` and `react-dom`). |
| Fonts | 🔵 | `next/font`, self-hosted, `latin` subset ✅. Inter loads the `opsz` axis, which makes a larger file; confirm the design needs optical sizing. |
| `will-change: transform` on all 4 full-screen service cards ([services.css](app/components/sections/home/services/services.css)) | 🔵 | Permanent compositor layers; minor memory cost on mobile. |
| Home HTML is 240 KB | ⚪ | Mostly inline SVG mockups plus the RSC payload. Acceptable. |
| AVIF | ⚪ | `images.formats` is the default (WebP). Optional. |

---

## Security

| Area | Finding |
|---|---|
| Secrets | ✅ `.env.local` holds one variable, `VERCEL_OIDC_TOKEN` (Vercel CLI generated). It is git-ignored, has **never been committed** (checked history), is not `NEXT_PUBLIC_`, and is not read by code. |
| Client exposure | ✅ There are no `process.env` references in app code. |
| XSS | ✅ No `dangerouslySetInnerHTML`, no markdown or HTML rendering, no user content rendered back. |
| API surface | ✅ None today. |
| Auth | ⚪ None; nothing stored in `localStorage` or `sessionStorage`. |
| Security headers | 🟡 None configured in [next.config.ts](next.config.ts). Add a `headers()` with `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`, and a minimal `Permissions-Policy`. Vercel already sends HSTS. Set `poweredByHeader: false`. **Skip a nonce-based CSP:** it forces dynamic rendering. A static CSP can come with analytics or the CMS. |
| Image optimizer | 🟡 `remotePatterns: images.unsplash.com` is **unused**, but it lets anyone push arbitrary Unsplash images through your `/_next/image` quota. Remove it. |
| Third-party scripts | ⚪ None (no analytics, no GTM). |
| Future form | Validate on the server (never trust the client), rate limit, add a honeypot or Turnstile, cap file size and type, and never email raw uploads unscanned. |

### Environment variables

| Variable | Used where | Server/Client | Sensitive? | Correct? |
|---|---|---|---|---|
| `VERCEL_OIDC_TOKEN` | Nowhere in code (Vercel CLI) | Server-only | Yes | ✅ Ignored, never committed |

---

## SEO

H2 covers the core gaps. Additionally:
- ✅ Correct `<h1>` per page, sensible `h2`/`h3` order, `aria-labelledby` on sections, alt text on content images, `alt=""` on decorative ones, `lang="en"`.
- 🔵 The footer year comes from `new Date()` at build time, so it is frozen until the next build. Fine, since CMS rebuilds will refresh it.
- **CMS readiness:** future case-study or service detail pages will need `generateMetadata` and `generateStaticParams`. Nothing in the current structure blocks that.

## Accessibility

**Strong baseline:** a global `:focus-visible` ring, `inert` on the closed mobile menu, Escape and outside-click to close it, real radio inputs behind the styled chips, `aria-pressed` filter buttons, `aria-live` on filter results, reduced-motion handling in most effects, and 44px touch targets on the nav.

| Issue | Severity | Location |
|---|---|---|
| Dead or inert primary buttons | 🟠 | H1 |
| Logo marquee loops forever with pause **on hover only**, with no keyboard or touch pause (WCAG 2.2.2) | 🟡 | [ProvenSection.tsx:39](app/components/sections/contact/proven/ProvenSection.tsx#L39) |
| `cursor-pointer` and hover styles on non-interactive items (false affordance) | 🟡 | [ProvenSection.tsx:51](app/components/sections/contact/proven/ProvenSection.tsx#L51), [HeroContent.tsx:54](app/components/sections/home/hero/HeroContent.tsx#L54) |
| Step dots: about 15px wide hit area (below WCAG 2.5.8's 24px and the project's 44px rule) | 🔵 | [StepSlide.tsx:50](app/components/sections/home/how-we-work/StepSlide.tsx#L50) |
| Footer legal links hover to `text-cyan/80` on off-white, which breaks DESIGN §3.3 and fails contrast | 🔵 | [Footer.tsx:109](app/components/layout/footer/Footer.tsx#L109) |
| 600svh of scroll for the 4-slide carousel can feel like scroll-jacking; keyboard and focus are handled | ⚪ | Product decision |

## CSS and design system
**Centralized and enforced.** Tokens live in `@theme`, Tailwind defaults are cleared, `type-*` utilities exist per Figma style, ESLint blocks arbitrary colours, and `check-tokens.mjs` blocks stray CSS files. Only 3 effect CSS files exist, all justified.
- Dead utilities: `type-display-80`, `type-numeral`, `type-label-16-upper`. 🔵
- [StepSlide.tsx:30](app/components/sections/home/how-we-work/StepSlide.tsx#L30) uses `type-wordmark` for the numeral, while DESIGN.md documents `type-numeral` (408px). That is code/doc drift: one of them is wrong. 🔵
- Header behaviour is coupled to the CSS class `section.hero` through a DOM query ([Header.tsx:78](app/components/layout/header/Header.tsx#L78)). This is an implicit contract; a `data-hero` attribute would make it explicit. 🔵

## Dependencies and configuration
- **Dependencies are minimal:** `next`, `react` and `react-dom` at runtime; Tailwind 4, ESLint 9 and TypeScript 5 for dev. Nothing to remove. Patch updates are available (`next` 16.4.0, `react` 19.3.0). No `engines` field.
- `tsconfig`: `strict`, `bundler` resolution ✅. `allowJs` is unneeded (no JS sources besides configs). ⚪
- No Prettier, no CI, no `.nvmrc`. 🔵

## Testing and deployment
- **Testing: none** (no unit, E2E or CI). The highest-value additions, in order:
  1. A Playwright smoke test per route: the page renders, no console errors, every internal `href` and `#anchor` resolves. **This would have caught H1.**
  2. Form validation and submit behaviour, once the backend exists.
  3. Unit tests for the pure scroll math (`slideAt`).
  4. A schema parse test for CMS content, once a CMS exists.
- **Deployment:** Vercel-linked, with a static build. There is no CI gate; add a minimal GitHub Action running `npm run lint`, `tsc --noEmit` and `next build`.
- `README.md` is create-next-app boilerplate (it even mentions Geist, which isn't used). 🔵

## Dead code and redundancy

| Item | Status |
|---|---|
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | **Definitely dead** |
| `images.unsplash.com` remote pattern | **Definitely dead** |
| `type-display-80`, `type-numeral`, `type-label-16-upper` utilities | **Definitely dead** (or `type-numeral` is the intended one; see the CSS section) |
| `buttonClassName` export | Unused outside `Button` |
| `VideoPlayer` + Play, Pause, Fullscreen, Volume and VolumeMuted icons | **Retained on purpose** (MEMORY.md) |
| DESIGN.md: duplicate `card` row in the Button size table; MEMORY "Next up" line is stale | Doc drift |

---

## Future CMS readiness

**Easy to migrate:** sections already driven by typed arrays (`services.ts`, `steps.ts`, `caseStudies.ts`, `team.ts`, `growth.ts`, `culture.ts`, `proven.ts`, `howWeSupport.ts`). These map 1:1 to CMS collections. Replace the import with an `await getX()` in the Server Component and the UI is unchanged.

**Moderate:**
- Case studies use `StaticImageData` imports. CMS images will be URLs, which needs `remotePatterns` for the CMS asset host plus explicit `width`/`height` or `fill`. `CaseStudy.image` must become `{ url, width, height, alt }`.
- `CaseStudyFilter` receives data through a module import. It will need it passed as props from a server parent (simple).
- `href: "#case-studies"` placeholders become real `/case-studies/[slug]` routes with `generateStaticParams`.

**High risk (fix before the CMS):**
1. **Copy is JSX with breakpoint-specific `<br className="max-lg:hidden" />`** in titles and descriptions across pages, `PILLARS`, `CtaSection` defaults and `PageHero` props. A CMS returns strings or rich text, not React elements. The codebase already has the solution: `services.ts` uses `title: string[]` (one entry per desktop line). Standardize on that shape (`lines: string[]`), or on plain strings with `max-w-[Nem]` / `text-balance`, and render the `<br>`s inside the component.
2. **Taxonomy duplication** (H5).

**What should become CMS content vs stay as code:**

| CMS | Code or config |
|---|---|
| Case studies, team, services (copy, points, images), process steps, stats, partner logos, page SEO fields, hero and section copy | Nav structure, theme maps, layout variants (`LAYOUTS`, `PRIMARY_WIDTHS`), canvas presets, icons, design tokens, contact/social config (`site.ts`) |

## Future backend readiness
The frontend makes **no assumptions** about databases, internal API proxies or response shapes, which is ideal. The recommended boundary is to call the backend or CMS **from Server Components and Server Actions only**, through a small `lib/cms.ts` with response validation. There should be no client-side API access and no `/api` proxy route unless a third party needs a webhook. The one route handler you'll want is a **CMS revalidation webhook** that calls `revalidateTag(tag, "max")`. In Next 16 the single-argument form is deprecated, so pass the profile. Caching should use `"use cache"` + `cacheTag`, or `fetch` with `next: { tags }`.

**Authentication:** nothing blocks it. Keep the CMS admin in the CMS's own UI. If preview mode is needed, use Next's Draft Mode, and keep tokens in server-only env vars without `NEXT_PUBLIC_`. Note that in Next 16 `middleware` is renamed `proxy`.

**Observability:** none today, and none needed for a static site. Once the form and CMS exist, add error monitoring for Server Actions and webhook failures, plus privacy-respecting analytics with a consent banner if required.

---

## Engineering maturity scores

| Area | Score | Reasoning |
|---|---:|---|
| Next.js architecture | 7 | Static App Router, correct defaults; missing SEO files, fallback routes, shared layout |
| React architecture | 8 | Idiomatic, no effect misuse, refs for animation |
| Server/Client boundary | 9 | 8 justified islands, `children` pattern used consistently |
| Component architecture | 7.5 | Clear ownership and shared promotion; some JSX-in-data |
| Code reusability | 6.5 | Good shared sections; serious taxonomy and config duplication |
| Code quality | 7.5 | Readable and well commented; heavy (deliberate) magic px; no formatter |
| TypeScript | 7 | Strict, good unions; `ReactNode` content; scattered `!` |
| State management | 9 | Minimal and local, nothing to remove |
| Data architecture | 5 | Fine for static; mixed sources and non-serializable content |
| Performance | 6 | Static and light JS; perpetual canvas loops, heavy sources |
| Security | 7 | Tiny surface, no secrets leaked; no headers, open remote pattern |
| SEO | 3.5 | Wrong home title, no sitemap, robots, OG or base URL |
| Accessibility | 7 | Strong foundations; dead buttons, marquee, small targets |
| Testing | 1 | None |
| Maintainability | 7 | Excellent docs and lint guards; doc drift starting |
| Scalability | 6.5 | Folder model scales; content model doesn't yet |
| CMS readiness | 5 | Half data-driven, half JSX copy |
| Backend integration readiness | 6.5 | No wrong assumptions; no seam (`lib/`) yet |
| Developer experience | 7 | Guards and docs; no CI, Prettier or real README |

## Finding registry

| ID | Sev | Category | File | Problem | Recommendation | Timing |
|---|---|---|---|---|---|---|
| C1 | 🔴 | UX / business | InquiryForm.tsx:63 | Submissions discarded, success shown | Hide or mailto now; Server Action later | Now |
| H1 | 🟠 | Functional | HeroContent.tsx:40, CtaSection.tsx:59, PageHero.tsx:38, Footer.tsx:88 | CTAs inert or self-linking | Point to `/contact` | Now |
| H2 | 🟠 | SEO | layout.tsx:20 | Leftover title; no sitemap, robots, OG, base URL | Metadata template plus file conventions | Now |
| H3 | 🟠 | Perf / a11y | LinesBackground.tsx:290 | rAF never stops; ignores reduced motion | IntersectionObserver plus static frame | Now |
| H4 | 🟠 | Launch | multiple | Typo, XX stats, fake phone, missing privacy page | Content pass | Before launch |
| H5 | 🟠 | Architecture | 7+ files | Service taxonomy and config duplicated | `services` registry plus `site.ts` | Before CMS |
| M1 | 🟡 | CMS | page/section props | Copy as JSX with `<br>` | `lines: string[]` convention | Before CMS |
| M2 | 🟡 | Security | next.config.ts | No headers; unused Unsplash pattern | `headers()`, remove pattern | Now |
| M3 | 🟡 | Perf | public/images | 10 MB / 3.4 MB sources | Re-export at about 2× display | Now |
| M4 | 🟡 | Routing | app/ | No `not-found`, `error`; 6 duplicated page shells | Branded 404 now; route-group layout; `error.tsx` with CMS | Now / CMS |
| M5 | 🟡 | A11y | ProvenSection.tsx:39,51 | Marquee lacks pause; false affordances | Pause button; drop `cursor-pointer` | Now |
| M6 | 🟡 | Quality | repo | No tests, no CI | Playwright smoke plus CI gate | Before CMS |
| L1 | 🔵 | Next 16 | Header.tsx:172 | Deprecated `priority` | `preload` or `loading="eager"` | Nice to have |
| L2 | 🔵 | A11y | StepSlide.tsx:50, Footer.tsx:109 | Small dots; cyan on off-white | Enlarge hit area; neutral hover | Nice to have |
| L3 | 🔵 | Dead code | public/*.svg, globals.css | Unused SVGs and utilities | Delete | Nice to have |
| L4 | 🔵 | Coupling | Header.tsx:78 | `section.hero` DOM contract | `data-hero` attribute | Nice to have |
| L5 | 🔵 | Docs | README, DESIGN.md | Boilerplate README; numeral drift; duplicate row | Update | Nice to have |
| L6 | 🔵 | Consistency | pages, Header.tsx:15 | Relative vs alias imports; formatting | Prettier; `@/` everywhere | Nice to have |
| L7 | 🔵 | TS | LinesBackground, ProcessTimeline:16 | Non-null assertions | Narrowed locals or a guard | Nice to have |

## Prioritization

**Fix immediately:** C1, H1, H2, H3, the content parts of H4 (typo, phone, privacy page), M2, M3, M5.

**Fix before the backend or CMS:** H5 (`services` registry and `site.ts`), M1 (serializable copy), M4 (`not-found`, shared layout), M6 (smoke tests and CI), and image types that accept URLs.

**Fix during backend integration:** the form as a Server Action with validation and spam control; `lib/cms.ts` with schema validation; tag-based revalidation plus a webhook route; `error.tsx` and `loading.tsx` where fetches can fail or be slow; `generateMetadata` and `generateStaticParams` for detail pages; URL-based case-study filtering; CMS `remotePatterns`; monitoring.

**Nice to have:** L1–L7, AVIF, the `opsz` font axis review.

### Do not change
- The Server/Client split and the "client wrapper, server children" pattern.
- No state library, no React Query, no global context.
- The Tailwind-only rule, the token system, `check-tokens.mjs` and the ESLint colour rule.
- The `Button` API and the shared-section promotion rule (`sections/shared/`).
- The section header rows. Don't abstract them; the per-section grids are genuinely different.
- The measured pixel values. They're a documented fidelity choice.
- Static rendering. Don't add `dynamic`, caching layers or ISR until real data exists.
- The dependency list. Don't add libraries for any of the fixes above.

## Refactoring roadmap

| Phase | Tasks | Impact | Risk |
|---|---|---|---|
| **0: Audit** | This report | n/a | n/a |
| **1: Critical** | C1 form honesty; H1 CTA hrefs; H2 metadata, sitemap, robots, OG; H3 canvas pause; H4 typo, phone, privacy | Stops lead loss, fixes conversion and indexing | Low: small and local |
| **2: Structural cleanup** | `site.ts` + `services` registry (H5); route-group layout; branded `not-found`; remove dead assets and utilities; Prettier | Single source of truth | Low–medium: touches many imports |
| **3: Next.js optimization** | Security headers; image re-export; `preload` prop; marquee pause | Perf, security, a11y | Low |
| **4: CMS preparation** | Serializable copy (`lines: string[]`); image type `{url,width,height,alt}`; Playwright smoke and CI | Swapping in the CMS becomes a data-source change | Medium: visual regressions; the smoke tests guard them |
| **5: Backend integration** | `lib/cms.ts` with validation; `"use cache"`/`cacheTag` + revalidation webhook; Server Action form; detail routes with `generateStaticParams`/`generateMetadata`; `error.tsx` | Dynamic content stays statically fast | Medium |
| **6: Production hardening** | Monitoring, analytics with consent, static CSP, rate limiting, form E2E tests | Operability | Low–medium |

## Recommended future architecture

```text
CMS (content, images, SEO fields) ── webhook ──► app/api/revalidate/route.ts → revalidateTag(tag, "max")
        │
        ▼
lib/cms.ts  (server-only fetch + schema validation, cacheTag per collection)
        │
        ▼
Server Components: pages + sections (unchanged markup; data via props)
   generateStaticParams / generateMetadata for /case-studies/[slug], /services/[slug]
        │
        ▼
Client islands only where needed (same 7 as today) + InquiryForm → Server Action → email/CRM
site.ts + services registry stay in code (config, not CMS)
```

## Architecture decision records

**ADR-1: Fix CTAs and the form before anything else.** *Problem:* conversion paths are broken or deceptive. *Alternatives:* build the backend first (slow, and leaves the site misleading meanwhile). *Recommendation:* point every CTA at `/contact`, and make the form honest (mailto fallback) now. *Timing:* now.

**ADR-2: One site config and one service registry.** *Problem:* 7+ copies with drifting names. *Alternatives:* put it all in the CMS (overkill for nav and contact info); leave it (guaranteed drift). *Recommendation:* `app/config/site.ts` (or `lib/site.ts`) plus a typed `SERVICES` registry that the hero list, filter categories, form options, footer and tags all derive from. *Timing:* before the CMS.

**ADR-3: Serializable content shape.** *Problem:* `ReactNode` copy with layout `<br>`s. *Alternatives:* rich text from the CMS (overkill for headings); CSS-only wrapping (loses the designed line breaks). *Recommendation:* `lines: string[]` for designed headings (already used in `services.ts`), plain strings for body copy. *Timing:* before the CMS.

**ADR-4: CMS access through Server Components only.** *Problem:* not yet built. *Alternatives:* client fetching with React Query (an SPA pattern that would undo today's good boundaries); internal `/api` proxy (an extra hop with no benefit). *Recommendation:* `lib/cms.ts` (server-only) plus tag-based revalidation. *Timing:* during backend work.

**ADR-5: Pause off-screen canvas work.** *Problem:* perpetual rAF. *Alternatives:* replace the canvas with static images (loses the design); throttle the fps (still wasteful). *Recommendation:* IntersectionObserver plus a reduced-motion static frame. *Timing:* now.

---

## Next.js checklist answers

1. **Next.js or React-in-Next?** A genuine Next.js architecture.
2. **Server Components used effectively?** Yes.
3. **Client Components justified?** All 8.
4. **Boundaries too high?** No, they sit at the leaves.
5. **Data fetched on the correct side?** There is no fetching; static imports are on the server.
6. **State only where needed?** Yes.
7. **Server data treated as client state?** No.
8. **Caching correctly configured?** Nothing to cache yet, which is correct.
9. **Rendering strategy appropriate?** Fully static, which is appropriate.
10. **`next/image` used correctly?** Yes (`sizes` set). Sources are oversized and `priority` is deprecated.
11. **Metadata used correctly?** The API is used, but the content is incomplete (H2).
12. **Route handlers necessary where they exist?** None exist; none are needed.
13. **Middleware necessary where it exists?** None exists; none is needed.
14. **Over-engineered?** No. The two scroll engines are complex but earned.
15. **Under-engineered?** In SEO, tests, CI and config centralization.
16. **Folder architecture scalable?** Yes for pages and sections; it needs `lib/` or `config/` soon.
17. **Ready for CMS content?** Partially (M1, H5).
18. **Can a backend be added without major rewrites?** Yes.
19. **Secrets protected?** Yes.
20. **Unnecessary JS shipped?** Minimal. The main runtime waste is the canvas loop, not bundle size.

## Final summary

### Top 10 problems
1. The contact form fakes success and drops data (C1).
2. Home hero CTAs are inert; the shared CTA links to itself (H1).
3. Wrong homepage title; no sitemap, robots, OG or base URL (H2).
4. Two perpetual 60 fps canvas loops per page, ignoring reduced motion (H3).
5. No privacy policy while collecting personal data (H4).
6. Service taxonomy and contact/nav config duplicated with inconsistent names (H5).
7. Copy stored as JSX with layout `<br>`s, blocking the CMS (M1).
8. No tests and no CI gate (M6).
9. 10 MB / 3.4 MB image sources (M3).
10. No security headers; an open, unused remote image pattern (M2).

### Top 10 recommended improvements
1. Make the form honest now; a Server Action later.
2. Point every CTA at `/contact`.
3. Root `metadataBase`, title template, `sitemap.ts`, `robots.ts`, OG image.
4. Pause the canvas off-screen and under reduced motion.
5. `site.ts` + a `services` registry.
6. `lines: string[]` content convention.
7. A Playwright link and route smoke test plus a CI build gate.
8. Security headers via `next.config.ts`; drop the Unsplash pattern.
9. Re-export oversized images.
10. A branded `not-found.tsx` and a route-group layout for Header and Footer.

### Top 10 things done well
1. Minimal, justified client islands with server `children`.
2. Fully static rendering with no needless dynamic APIs.
3. A design system enforced by lint, not just documented.
4. The `Button` API: typed variants, correct link handling, layout-only `className`.
5. Data-driven repeated cards with theme maps.
6. Shared sections promoted only when a second page needs them.
7. Reduced-motion and keyboard care in the scroll effects and the mobile menu.
8. A zero-dependency footprint (`next`, `react`, `react-dom` only).
9. Strict TypeScript, `satisfies`, discriminated unions, no `any`.
10. Thorough decision records (MEMORY.md) that explain *why*, plus correct handling of secrets in git.

### Overall engineering score: **66 / 100**
The architecture itself is solid, about 80 by Next.js and React standards. The score is pulled down by things that would hurt a live site today (the broken conversion paths, the form, SEO) and by a content model that needs one preparatory pass before a CMS. None of it requires a rewrite. Phase 1 is a few hours of work, and Phase 2 plus the CMS preparation in Phase 4 is roughly one to two focused days.

I can also publish this as a shareable page if you want to pass it to the team.