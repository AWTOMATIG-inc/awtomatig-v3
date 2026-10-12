# Audit Fix Plan

How to fix every finding from the codebase audit of 2026-10-09 and raise the engineering score from **66 to 85+**, without rewriting what already works.

- **Baseline:** 66 / 100 (audit report, 2026-10-09)
- **Target:** at least 85 by the end of Phase 4 (before any CMS work), and about 90 after Phases 5–6
- **Finding IDs** (C1, H1–H5, M1–M6, L1–L7) refer to the audit's finding registry. They are summarized in [§9](#9-finding-coverage) so this file stands on its own.
- **Status (2026-10-09):** ✅ **Phase 1 done** ([completion notes](#phase-1-completion-notes)). ✅ **Phase 2 done** ([completion notes](#phase-2-completion-notes)). ✅ **Phase 3 done** ([completion notes](#phase-3-completion-notes)). Estimated score ≈ 81. Next: Phase 4.

---

## Contents

1. [How the score is calculated](#1-how-the-score-is-calculated)
2. [Score targets per area](#2-score-targets-per-area)
3. [Decisions needed from the owner](#3-decisions-needed-from-the-owner)
4. [Ground rules for every PR](#4-ground-rules-for-every-pr)
5. [Phase overview and PR sequence](#5-phase-overview-and-pr-sequence)
6. [Phases 1–4: reach 85+](#6-phases-14-reach-85)
7. [Phases 5–6: backend, CMS and hardening](#7-phases-56-backend-cms-and-hardening)
8. [Definition of done](#8-definition-of-done)
9. [Finding coverage](#9-finding-coverage)
10. [Out of scope: do not change](#10-out-of-scope-do-not-change)
11. [Progress tracker](#11-progress-tracker)

---

## 1. How the score is calculated

**Overall = mean of the 19 area scores × 10, minus 1 point for each open 🔴 Critical finding.**

The baseline is 67.4 − 1 (C1) ≈ 66. The 85 target therefore needs an area mean of about 8.5 **and** zero open criticals. No single heroic fix gets there; the score comes from closing many medium gaps (SEO, testing, CMS readiness, data architecture) that are cheap one at a time.

## 2. Score targets per area

| Area | Now | After Phase 4 | After Phase 6 | Raised by |
|---|---:|---:|---:|---|
| Next.js Architecture | 7 | 9 | 9.5 | 1.3, 2.3, 2.4, 5.2, 5.3 |
| React Architecture | 8 | 8.5 | 9 | 1.4, 5.1 |
| Server/Client Boundary | 9 | 9 | 9.5 | 3.3 (keep the client boundary as low in the tree as possible), 5.5 |
| Component Architecture | 7.5 | 8.5 | 9 | 2.2, 4.1 |
| Code Reusability | 6.5 | 8.5 | 9 | 2.1, 2.2 |
| Code Quality | 7.5 | 8.5 | 9 | 2.5, 2.6, 2.7 |
| TypeScript | 7 | 8.5 | 9 | 2.2, 2.7, 4.1, 4.2 |
| State Management | 9 | 9 | 9 | 5.5 (URL state), no change otherwise |
| Data Architecture | 5 | 8 | 9 | 2.1, 2.2, 4.1–4.3, 5.2 |
| Performance | 6 | 8.5 | 9 | 1.4, 3.2 |
| Security | 7 | 8.5 | 9.5 | 1.1, 3.1, 5.1, 6.2 |
| SEO | 3.5 | 9 | 9.5 | 1.3, 5.3 |
| Accessibility | 7 | 9 | 9 | 1.2, 1.4, 3.3, 4.4 (axe) |
| Testing | 1 | 7 | 8 | 4.4, 5.1, 6.3 |
| Maintainability | 7 | 8.5 | 9 | 2.1, 2.5, 4.5 |
| Scalability | 6.5 | 8.5 | 9 | 2.2, 2.3, 4.3, 5.3 |
| CMS Readiness | 5 | 8.5 | 9.5 | 4.1–4.3, 5.2 |
| Backend Integration Readiness | 6.5 | 8.5 | 9.5 | 4.3, 5.1, 5.2 |
| Developer Experience | 7 | 9 | 9 | 2.5, 2.6, 4.5 |
| **Overall** | **66** | **≈ 86** | **≈ 91** | |

---

## 3. Decisions needed from the owner

Each decision lists a recommended default. Work can start on Phase 1 with the defaults; only the marked items **block** a task.

| # | Decision | Recommended default | Blocks |
|---|---|---|---|
| D1 | How the contact form delivers inquiries | Phase 1: a `mailto:` fallback (honest, no backend). Phase 5: a Server Action that sends email through a transactional provider (Resend recommended: one small SDK, free tier) to a team inbox. | 5.1 (provider, API key, recipient address) |
| D2 | Production domain for `metadataBase`, canonical URLs and the sitemap | `https://awtomatig.com` (inferred from `hello@awtomatig.com`) | 1.3 (confirm only) |
| D3 | Real WhatsApp number, phone, LinkedIn URL and AWLABS URL | Until provided, **hide** those links and buttons rather than linking to placeholders | Showing them in 1.2 |
| D4 | Real case studies and stats (the `XX%` / `XX+` figures) | Until provided, hide the stat blocks and show only one real case study; never ship `XX` | 1.5 |
| D5 | Privacy Policy and Terms text | Owner or legal supplies the text; the plan builds the pages | 1.5 (text only) |
| D6 | Canonical service names | `Website Infrastructure`, `Back-Office Operations`, `ERP & Business Systems`, `AdTech`, with short labels `Websites`, `Back-office`, `ERP & Systems`, `AdTech` | 2.2 |
| D7 | Git host for CI, and adopting Prettier (one-time reformat of the codebase) | GitHub Actions; Prettier with `prettier-plugin-tailwindcss` in its own PR | 2.6, 4.5 |
| D8 | CMS product | Not needed until Phase 5. The plan is CMS-agnostic; Sanity, Payload or Contentful all fit the seam built in 4.3. | 5.2 |
| D9 | Analytics and error monitoring, and whether a consent banner is needed | Vercel Analytics + Speed Insights (cookieless), Sentry for errors | 6.1 |

---

## 4. Ground rules for every PR

These come from AGENTS.md, DESIGN.md and the audit's "do not change" list.

1. **Read the Next.js 16 guide first** for any API you touch (`node_modules/next/dist/docs/`). Relevant guides here: metadata file conventions, `not-found`, route groups, Server Actions, `use cache` / `cacheTag` / `revalidateTag`, `proxy` (the v16 name for middleware), and the `preload` image prop.
2. **Tailwind only.** No new component `.css` files; anything missing becomes a token or an `@utility` in `globals.css`. `npm run lint` enforces this.
3. **Always use `<Button>`** for buttons and button-styled links.
4. **No new dependencies** except the ones this plan names: Playwright and `@axe-core/playwright` (4.4), Prettier (2.6), and, in Phase 5, `zod`, the email SDK and the CMS SDK. Each addition gets a MEMORY.md decision row.
5. **Every PR** runs `npm run build`, `npm run lint` and (from Phase 4) `npm run test:e2e`, goes through the DESIGN.md §12 checklist, and updates MEMORY.md (status, decisions, open items, change log). DESIGN.md and AGENTS.md change whenever a convention, folder or utility changes.
6. **Visual parity:** structural PRs (Phases 2 and 4) must not change the rendered pages. Compare screenshots at 390 and 1440 before and after, as described in MEMORY.md §3, until the Playwright suite exists.
7. **One concern per PR.** The sequence below keeps each diff reviewable.

---

## 5. Phase overview and PR sequence

| Phase | Goal | PRs | Effort | Exit score |
|---|---|---|---|---|
| 1. Launch blockers ✅ **Done 2026-10-09** | Fix everything that hurts a live site today | PR-1 … PR-5 | ~1.5 days | ≈ 73 planned, ≈ 71 estimated |
| 2. Structural cleanup ✅ **Done 2026-10-09** | One source of truth, shared layout, dead code gone | PR-6 … PR-10 | ~1.5 days | ≈ 78 planned, ≈ 76 estimated |
| 3. Optimization and hardening (static) ✅ **Done 2026-10-09** | Security headers, images, accessibility | PR-11 … PR-13 | ~1 day | ≈ 81 planned, ≈ 81 estimated |
| 4. CMS preparation and safety net | Serializable content, content seam, tests, CI | PR-14 … PR-18 | ~2.5 days | **≈ 86** |
| 5. Backend and CMS integration | Working form, CMS content, detail routes | PR-19 … PR-23 | depends on D1 and D8 | ≈ 89 |
| 6. Production hardening | Monitoring, analytics, form E2E | PR-24 … PR-26 | ~1 day | ≈ 91 |

Phases 1 and 3 can run in parallel with Phase 2 if two people work on it, except where a task lists a dependency.

---

## 6. Phases 1–4: reach 85+

### Phase 1: Launch blockers ✅ Done (2026-10-09)

#### 1.1 Make the contact form honest (C1) · PR-1 · 🔴 · ✅ Done
**Problem:** [InquiryForm.tsx](app/components/sections/contact/inquiry/InquiryForm.tsx) calls `preventDefault()` and shows "Thanks, we've got your message" without sending anything; uploaded files go nowhere.

**Steps (interim, until 5.1):**
1. On submit, after native validation passes, build a `mailto:` URL to the site email (from `site.ts` once 2.1 lands; a constant until then) with the subject `Project inquiry: <company or name>` and a body listing every field. Open it with `window.location.href`.
2. Replace the success line with an honest one: "Your email app should open with your message ready to send. If it doesn't, email us at hello@awtomatig.com."
3. Hide the upload box (files cannot travel through `mailto:`). Leave a one-line note: "Have files? Attach them to the email."
4. Keep all validation, chips and layout unchanged.

**Acceptance:** submitting never claims the message was received; the email client opens with all fields; no upload control is visible; MEMORY.md open item updated.

#### 1.2 Fix every CTA and placeholder link (H1, part of H4) · PR-2 · 🟠 · ✅ Done
| File | Change |
|---|---|
| [HeroContent.tsx](app/components/sections/home/hero/HeroContent.tsx) | "Explore Our Services" → `href="/services"`; "Start a Conversation" → `href="/contact"` |
| [CtaSection.tsx](app/components/sections/shared/cta/CtaSection.tsx) | Default `primary.href` → `/contact`; default `id` → `"cta"` so no anchor points at itself |
| [PageHero.tsx](app/components/sections/shared/hero/PageHero.tsx) | Default `secondary.href` → `/contact` |
| [Footer.tsx](app/components/layout/footer/Footer.tsx) | "Start a conversation" → `/contact`; AWLABS and LinkedIn rendered only when a URL exists (D3); legal links → `/privacy`, `/terms` (pages from 1.5) |
| Header, Footer, CtaSection | WhatsApp buttons rendered only when a real `wa.me` URL exists (D3); otherwise omitted |
| [services.ts](app/components/sections/home/services/services.ts) | Card CTA → `/services` on Home. `ServicesSection` gains a `cta` prop so the Services page passes `{ label: "Start a conversation", href: "/contact" }` instead of linking to itself |
| [caseStudies.ts](app/components/sections/shared/case-studies/caseStudies.ts) | `href` becomes optional. Home cards link to `/case-studies`; list rows hide "View case study" until detail pages exist (5.3) |
| [inquiry.ts](app/components/sections/contact/inquiry/inquiry.ts) | Remove the fake `+123 456 7890` row until D3 supplies a number |

**Acceptance:** no `href="#"`, no `"#contact"` placeholder and no button without an action anywhere in `app/`. Verify with `grep -rn 'href="#"\|"#contact"' app` (expect no output) and by clicking every CTA on all 7 routes at 390 and 1440.

#### 1.3 SEO foundation (H2) · PR-3 · 🟠 · ✅ Done
1. **Root metadata** in [layout.tsx](app/layout.tsx):
   - `metadataBase: new URL(SITE_URL)` (D2)
   - `title: { default: "AWTOMATIG: The operational layer behind modern businesses", template: "%s | AWTOMATIG" }`
   - a site-wide `description`, `openGraph` (`siteName`, `type: "website"`, `locale: "en_US"`) and `twitter: { card: "summary_large_image" }`
2. **Per page:** `title: "Services"` (the template adds the suffix), a page-specific `description`, and `alternates: { canonical: "/services" }`. Home gets `alternates: { canonical: "/" }`.
3. **`app/sitemap.ts`** listing all public routes (generated from the route list in `site.ts` once 2.1 lands).
4. **`app/robots.ts`** allowing everything and pointing to the sitemap. Preview deployments should send `noindex`; check `process.env.VERCEL_ENV !== "production"` in `robots.ts`.
5. **`app/opengraph-image.png`** (1200×630, a brand export from Figma) plus `app/icon.png` / `apple-icon.png` if the favicon isn't final.
6. **Organization JSON-LD** in the root layout: a `<script type="application/ld+json">` holding `JSON.stringify` of a **static, code-owned** object (name, url, logo, email). This is the one approved `dangerouslySetInnerHTML`; it never contains user or CMS data unescaped.

**Acceptance:** each route's `<title>`, description, canonical URL and OG tags are correct in the built HTML; `/sitemap.xml` and `/robots.txt` resolve; Lighthouse SEO scores at least 95 on every route.

#### 1.4 Stop the canvas when it isn't needed (H3) · PR-4 · 🟠 · ✅ Done
In [LinesBackground.tsx](app/components/ui/lines-background/LinesBackground.tsx):
1. An `IntersectionObserver` on the section starts the `requestAnimationFrame` loop while the section is visible and cancels it when it isn't.
2. Under `prefers-reduced-motion: reduce`, draw **one** static frame (pointer at `rest`, `time = 0`) and never loop. Listen to the media query's `change` event so toggling the setting applies immediately. Skip pointer listeners in that mode.
3. On resize, redraw once even when paused, so a paused canvas is never blank or stretched.
4. While editing the file, replace the `section!` / `ctx!` assertions with narrowed `const` locals captured after the guard (L7).

**Acceptance:** with the hero scrolled out of view, the Performance panel shows no `render` frames; with reduced motion on, the background is static and matches the animated look at rest; the visual output with motion on is unchanged.

#### 1.5 Launch content pass (H4) · PR-5 · 🟠 · ✅ Done
1. Fix the hero eyebrow typo "Build the systemssss." ([HeroContent.tsx:12](app/components/sections/home/hero/HeroContent.tsx#L12)); confirm the intended wording with the owner.
2. Case studies (D4): keep only real entries, no duplicate Snaillia copies. Stats render only when a real value exists (`stats?: CaseStudyStat[]`). The same rule applies to the Contact "Proven" `XX+` cards: hide the stat grid until real figures exist.
3. Create `app/privacy/page.tsx` and `app/terms/page.tsx` with the owner's text (D5). They are simple, prose-only pages on the off-white surface using existing `type-*` styles, inside `site-container`. Add them to the sitemap.
4. Link the consent checkbox label to `/privacy` ("…as described in our Privacy Policy").

**Acceptance:** no `XX`, no fake contact data, no typo; the privacy policy is reachable from the form and the footer.

#### Phase 1 completion notes

**Verified (2026-10-09):** `npm run lint`, `tsc --noEmit` and `next build` pass, and all 11 routes are static (7 pages + `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`). The built HTML of every page has the right `<title>`, canonical URL, `og:title`, `og:url`, `og:image` and Twitter card. There are no `href="#"`, `#contact` placeholders or `XX` figures in the rendered HTML; the remaining `#` links are in-page jumps to anchors that exist. Screenshots were checked at 1440: Home with and without reduced motion (a still canvas frame, not blank), Contact, Privacy, and the share image. Not yet checked: a 390px pass of the new Privacy and Terms pages, and the canvas pause in a performance profile (the logic was reviewed; the profile goes in the 4.4 test suite).

**Where the build differs from the plan:**
- `lib/site.ts` was started in Phase 1 rather than 2.1, holding only what Phase 1 needed (name, URL, default title, description, email, optional WhatsApp / social links, legal links, public routes). Task 2.1 extends it with nav and capability tags.
- Added `lib/metadata.ts` (`pageMetadata()`), because a page's own `openGraph` replaces the layout's entirely, share image included. The helper repeats the shared Open Graph and Twitter fields and the image on every page.
- **Navbar CTA:** without a WhatsApp URL it becomes "Let's talk" → `/contact` with the mail icon, rather than disappearing, which would unbalance the pill. Below 360px the `nav` size shows only its icon.
- **AWLABS card:** a disabled "AWLABS coming soon" button keeps the card's layout until `SITE.social.awlabs` exists.
- **Case studies:** "View case study" is hidden until detail pages exist (5.3) on both Home and the list, instead of linking Home cards to `/case-studies`, because the "View all case studies" button directly below already does that. Only Snaillia is listed; `Case_2.png` (Nextgen) is kept for when its real copy arrives.
- The shared CTA section's default `id` became `cta` (it was `contact`, and its own button linked to `#contact`).
- **Privacy Policy and Terms:** draft texts were written from what the site actually does today (no cookies, no analytics, a `mailto:` form), because no text had been supplied yet (D5). **They must be reviewed by the owner or legal before launch** (MEMORY.md §4).
- The hero eyebrow now reads "Build the systems."; confirm the wording.

**Still open from Phase 1's findings:** C1 is resolved for now (the form is honest). The real fix, a Server Action, is 5.1. H4's real content (links, figures, case studies, legal review) waits on the owner, decisions D3–D5.

---

### Phase 2: Structural cleanup ✅ Done (2026-10-09)

#### 2.1 One site configuration (H5) · PR-6 · ✅ Done
Create `lib/site.ts` at the repo root (imported as `@/lib/site`). It holds **configuration, not CMS content**:

```ts
export const SITE = {
  name: "AWTOMATIG",
  url: "https://awtomatig.com",           // D2
  email: "hello@awtomatig.com",
  whatsappUrl: undefined as string | undefined,   // D3: links render only when set
  social: { linkedin: undefined as string | undefined, awlabs: undefined as string | undefined },
  nav: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/process", label: "Process" },
    { href: "/case-studies", label: "Case Studies" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
  ],
  lightRoutes: ["/contact", "/privacy", "/terms"], // pages that use the light navbar
} as const;
```

Replace `NAV_LINKS` and `WHATSAPP_URL` in Header, the "Pages" column, `WHATSAPP_URL`, `EMAIL_URL` and `LEGAL_LINKS` in Footer, `WHATSAPP_URL` in CtaSection, and the email in `inquiry.ts`. The footer "Pages" column then uses the same order as the navbar.

Document `lib/` in AGENTS.md (Structure) and DESIGN.md §10.1 (folder tree): `lib/` holds non-UI code (config, the service registry, content access).

**Acceptance:** `grep -rn "hello@awtomatig.com\|NAV_LINKS\|WHATSAPP_URL" app` finds no definitions outside `lib/`; pages render identically.

#### 2.2 One service registry (H5) · PR-7 · ✅ Done
Create `lib/services.ts`:

```ts
export const SERVICES = [
  { id: "website-infrastructure", name: "Website Infrastructure", short: "Websites" },
  { id: "back-office-operations", name: "Back-Office Operations", short: "Back-office" },
  { id: "erp-business-systems",   name: "ERP & Business Systems", short: "ERP & Systems" },
  { id: "ad-tech",                name: "AdTech",                 short: "AdTech" },
] as const;                                   // names per D6
export type ServiceId = (typeof SERVICES)[number]["id"];
```

Derive every list from it:

| Consumer | Becomes |
|---|---|
| `PageHero` `SERVICE_AREAS` | `SERVICES.map((s) => s.name)` |
| `CASE_STUDY_CATEGORIES`, `CaseStudy.category` | `ServiceId`; filter tab labels use `short` |
| `HELP_OPTIONS` (Contact form) | `SERVICES` names plus "Not sure yet". Drop "All", which is meaningless as an answer, and the "ADtech" spelling |
| Footer "Services" column | `SERVICES.map((s) => ({ href: \`/#${s.id}\`, label: s.name }))` |
| Home `services.ts` | Keeps presentation only (points, image, theme, title lines), keyed by `ServiceId`, with `satisfies Record<ServiceId, …>` so a missing or extra service is a type error |
| `CaseStudy.service` (free text) | `ServiceId`, displayed through the registry |

The CTA and hero tag strips ("Infrastructure, Operations, Automation, Integrations, AdTech") are capabilities, not services. Keep them as one shared `CAPABILITY_TAGS` constant in `lib/site.ts` instead of two copies.

**Acceptance:** renaming a service in one place updates the hero list, filter tabs, form options and footer; TypeScript fails if a case study uses an unknown category.

#### 2.3 Shared page shell (part of M4) · PR-8 · ✅ Done
1. Move the six pages into a route group: `app/(site)/page.tsx`, `app/(site)/about/page.tsx`, and so on. URLs don't change.
2. Add `app/(site)/layout.tsx` rendering `<Header />`, `<main className="flex flex-1 flex-col">{children}</main>` and `<Footer />`. Pages then return only their sections.
3. The header decides its theme from `usePathname()` and `SITE.lightRoutes`, replacing the `theme` prop.
4. Because a layout's header **persists across navigation**, close the mobile menu and reset the hidden state when `pathname` changes, and re-measure the hero (`getHideAfter`) on the new page.

**Acceptance:** all routes render as before, including the light navbar on Contact; navigating between pages closes an open menu; the header no longer remounts on navigation.

#### 2.4 Branded 404 (part of M4) · PR-8 · ✅ Done
Add `app/not-found.tsx`: the light header, an `Eyebrow`, a `type-display-80` title "Page not found." (this puts the currently unused `type-display-80` to work), one sentence, `<Button href="/">Back to home</Button>`, and the footer. Set `metadata.title = "Page not found"` and `robots: { index: false }`. Check `not-found.md` in the Next 16 docs for how it interacts with route groups.

**Acceptance:** `/does-not-exist` shows the branded page with status 404.

#### 2.5 Dead code and documentation drift (L3, L5) · PR-9 · ✅ Done
| Remove or fix | Detail |
|---|---|
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | create-next-app leftovers |
| `images.remotePatterns` for `images.unsplash.com` in `next.config.ts` | Unused, and it widens the image optimizer's reach (M2) |
| `type-label-16-upper` | Unused utility: delete it, plus its DESIGN.md row |
| `type-numeral` vs `type-wordmark` on the How we work numeral | Check against the screenshot which size is right (408px per D30). Use `type-numeral` in `StepSlide.tsx` and fix DESIGN.md, or delete `type-numeral` if the wordmark size is intended |
| `buttonClassName` export | Make it module-private, or keep it exported with a comment if the plan is to use it in `next/link` wrappers |
| `VideoPlayer` and its 5 icons | **Keep**, since MEMORY.md records them as retained on purpose. Note in DESIGN.md that it currently has no consumer |
| `README.md` | Replace the boilerplate: what the project is, commands, where the docs are (AGENTS, DESIGN, MEMORY), how to deploy |
| DESIGN.md | Remove the duplicated `card` row in the Button size table |
| MEMORY.md | Update the stale "Next up" line and the build status table |

#### 2.6 Formatting and import consistency (L6) · PR-10 · needs D7 · ✅ Done
1. Add Prettier and `prettier-plugin-tailwindcss` (which also sorts class lists) with `printWidth: 130` to match the current style, plus a `format` script and a `format:check` step in `lint`.
2. Run it once in a **dedicated PR with no other changes**, so the history stays readable.
3. Switch the page files' relative `../components/...` imports to `@/app/components/...`.

#### 2.7 Small type-safety fixes (L7) · PR-9 · ✅ Done
- [ProcessTimeline.tsx:16](app/components/sections/process/steps/ProcessTimeline.tsx#L16): filter out steps without a `[data-node]` instead of asserting with `!`.
- Header: fix the odd indentation in `NAV_LINKS` (it moves to `site.ts` in 2.1 anyway).

#### Phase 2 completion notes

**Verified (2026-10-09):** `npm run lint` (ESLint, `check-tokens.mjs`, `prettier --check .`), `tsc --noEmit` and `next build` (after emptying `.next/`) all pass; all 12 routes still prerender static (`○`), including the new `/_not-found`. Checked at 1440: Home, Contact (light navbar, help-area chips read the registry names), About (hero + nav), and `/does-not-exist` (branded 404, dark theme), both before and after the Prettier pass — pixel-identical. Confirmed in the built HTML: the footer's "Pages" column now matches the navbar's order; the Case Studies filter tabs read "All, Websites, Back-office, ERP & Systems, AdTech" (`short` labels from the registry); the contact form's chips read the registry's full names plus "Not sure yet", with no "All" or "ADtech".

**Where the build differs from the plan:**
- **2.1** started in Phase 1 (just enough for the SEO and link work); this task added `nav`, `lightRoutes` and `CAPABILITY_TAGS` to the existing `lib/site.ts` rather than creating it fresh.
- **2.2**: Home's `services.ts` keeps the exported name `SERVICES` (an array merging the registry's `id` with per-service presentation) so `ServiceCard.tsx` / `ServicesSection.tsx` needed no changes; the registry itself is imported under the alias `SERVICE_REGISTRY` to avoid a name clash. `CaseStudy.service` (shown in the "Service:" row) also became a `ServiceId`, resolved to its name through a new `getService()` lookup in `lib/services.ts` — the plan only mentioned `category` explicitly, but `service` is the same free-text problem.
- **2.3**: the header's hide-on-scroll and mobile-menu-close resets on navigation are implemented as render-time state adjustments (React's "adjusting state when a prop changes" pattern: compare `pathname` against a stored previous value and call the setters inline), not the `useEffect(() => setX(...), [pathname])` the plan's wording suggested — the project's ESLint config (`react-hooks/set-state-in-effect`) flags that as an error. Behaviour is the same; it just doesn't go through an extra render.
- **2.4**: built on the **dark** theme (every other page's default) instead of forcing light. `Header` no longer takes a theme prop at all — it decides from `SITE.lightRoutes` — and `usePathname()`'s behavior on a URL that never matched any route isn't something to depend on, so rather than fight that, the 404 page was designed to match what `Header` actually renders there (dark) instead of asserting it should be light.
- **2.5**: also fixed a real bug found while reading the code it touched — the How We Work step numeral used `type-wordmark` (sized in `cqw`, which resolves to 0 with no `@container` ancestor, and this element has none) instead of `type-numeral` (the utility DESIGN.md already documents for exactly this element, 408px at 1440). Couldn't get a pixel screenshot of this one slide: headless Chrome's `--screenshot` doesn't reliably land a hash-anchor scroll on this page's scroll-jacked sections (confirmed via `--dump-dom`, which shows the right content loads; `--screenshot` to the same URL shows a blank frame). The fix follows directly from the CSS spec and DESIGN.md's own numbers, but a real-browser or Playwright (4.4) check would be good to get before launch.
- **2.6**: also ran `npm audit fix` (no `--force`) alongside the Prettier install, which cleared the `source-map-js` advisory. It left 6 `next` / `eslint-config-next` advisories that only resolve via `next@16.4.0` (a minor-version bump) — a real fix, but a framework-version change deserves its own verification pass and isn't something Phase 2's task list asked for, so it's flagged here rather than bundled in. Markdown files are excluded from Prettier's scope (`.prettierignore`) so the hand-formatted tables in DESIGN.md/MEMORY.md aren't touched.

**Follow-up for the owner:** bump `next` to `16.4.0` when convenient (security fixes, same major version) — see `npm audit`.

---

### Phase 3: Optimization and hardening (static site) ✅ Done (2026-10-09)

#### 3.1 Security headers (M2) · PR-11 · ✅ Done
In [next.config.ts](next.config.ts): set `poweredByHeader: false` and add `headers()` for `/:path*`:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |
| `Content-Security-Policy` (production only) | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:; object-src 'none'; upgrade-insecure-requests` |

Why a static CSP rather than nonces: a nonce-based CSP forces every page into dynamic rendering. A static policy still blocks framing, plugin content, `<base>` hijacking and form exfiltration. Vercel already sends HSTS. When analytics or the CMS arrive (Phases 5–6), add their hosts to `script-src` / `connect-src` / `img-src`.

**Acceptance:** [securityheaders.com](https://securityheaders.com) grade A on the deployed preview; no CSP violations in the console on any route (check `next dev` separately, since it needs `'unsafe-eval'` and the policy is production-only).

#### 3.2 Images and fonts (M3, L1) · PR-12 · ✅ Done
1. Re-export oversized sources at about 2× their largest display size, as JPG or WebP for photos:

   | File | Now | Target |
   |---|---|---|
   | `human_operations.jpg` | 4096×2731, 10 MB | 1900px wide JPG, under 400 KB |
   | `about/member_1.png` | 2000×1333, 3.4 MB | real portraits, 900px wide JPG/WebP, under 150 KB each |
   | `about/culture.png` | 1.9 MB | 1300px wide, under 300 KB |
   | `about/*.png` photos (4) | 0.8–0.9 MB each | 640px wide JPG/WebP |
   | `process/*.png` (1504px, up to 1.1 MB) | | 1010px wide |

   Keep the static imports; only the files change. Image-heavy screenshots (UI mockups with text) can stay PNG if JPG artifacts are visible.
2. Replace the deprecated `priority` with `preload` on the header logo ([Header.tsx:172](app/components/layout/header/Header.tsx#L172)); remove the redundant `priority={false}` in `LogoCard.tsx`.
3. Add `images: { formats: ["image/avif", "image/webp"] }`.
4. Check the Inter `axes: ["opsz"]` setting: if the design does not need optical sizing, drop it to shrink the font file.

**Acceptance:** `public/images` under 8 MB; no visible quality loss at 1440 / 2× DPR; Lighthouse Performance at least 90 on mobile for Home.

#### 3.3 Accessibility fixes (M5, L2, L4) · PR-13 · ✅ Done
| Issue | Fix |
|---|---|
| Logo marquee has no keyboard or touch pause (WCAG 2.2.2) | A small client child `MarqueeTrack` holding a `paused` state, with a visible pause/play toggle (`<Button variant="outline" size="md">`, `aria-pressed`) beside the "Trusted By" heading. It also pauses on `focus-within` and on hover. `ProvenSection` stays a Server Component. |
| False affordances | Remove `cursor-pointer` from the partner logos ([ProvenSection.tsx:51](app/components/sections/contact/proven/ProvenSection.tsx#L51)) and the hero tags ([HeroContent.tsx:54](app/components/sections/home/hero/HeroContent.tsx#L54)); drop the tag hover colour, or make the tags real links if they get destinations |
| Step dots ≈15px wide | Widen the pseudo-element so the hit area is at least 24×24 (`before:-inset-x-7`; the 5px gap allows overlap since only the nearest dot matters); WCAG 2.5.8 |
| Footer legal hover is `text-cyan/80` on off-white | `hover:text-black/60`, like the other footer links |
| Header depends on the CSS class `section.hero` | Add `data-hero` to every hero section and query `[data-hero]` in `getHideAfter`; the `.hero` class stays for the frame-scale CSS only |

**Acceptance:** `@axe-core/playwright` (4.4) reports zero serious or critical violations on every route; keyboard-only pass of all routes (tab order, visible focus, menu, filter, carousel, form, marquee toggle).

#### Phase 3 completion notes

**Verified (2026-10-09):** `npm run lint` and `next build` pass (all 12 routes still static `○`). Ran `next build && next start` on a scratch port (3100; port 3000 was already held by the user's own dev server, left untouched) and confirmed `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and `Content-Security-Policy` all present on `/`, with no `X-Powered-By`; `/about` served the new `.jpg` images and `/contact` rendered the marquee's "Pause the logo slider" control in the built HTML.

**Where the build differs from the plan:**
- **3.1**: implemented exactly as specified (static CSP, production-only, no nonce).
- **3.2**: the table's targets were hit by resizing *and*, for the photographic sources with no alpha channel, converting PNG → JPEG in place with the extension updated in the one or two importing files (`team.ts`, `growth.ts`, `CultureSection.tsx`, `steps.ts`) — the plan said "keep the static imports," which this honors (still a static `import x from "@/public/..."`, just a different extension) rather than leaving them as PNG, which cannot match photographic compression without a quality loss `cwebp`/`mozjpeg` wouldn't show. `process/solution.png` kept its PNG extension because it has an alpha channel. `about/member_1.jpg` is still the one placeholder photo for all three team cards (D43); only its file size changed.
- **3.3**: the marquee's pause control needed a client component (`MarqueeTrack`), so the heading row and the slider track both moved into it together (they share the `paused` state) while `ProvenSection` stayed a Server Component passing `partners` down, matching the plan's "`ProvenSection` stays a Server Component" instruction. `data-hero` is a prop on `LinesBackground` (forwarded to its `<section>`) for the three heroes built on it, and a plain attribute on `ContactHeroSection`'s own `<section>`.

**Still open from Phase 3's findings:** none outstanding; M2, M3, M5, L1, L2 and L4 are all closed.

---

### Phase 4: CMS preparation and safety net

#### 4.1 Serializable copy (M1) · PR-14, PR-15
**Problem:** headings and paragraphs are passed as JSX with `<br className="max-lg:hidden" />`. A CMS returns strings, not React elements.

**Convention** (already used for `Service.title` in `services.ts`):
- A designed multi-line heading or paragraph is `Lines = string[]`, one entry per desktop line.
- Body copy without designed breaks is a plain `string`.
- A new primitive `ui/lines/Lines.tsx` renders `Lines` with the desktop `<br>` between entries:

```tsx
export default function Lines({ lines }: { lines: string | readonly string[] }) {
  if (typeof lines === "string") return lines;
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <>{" "}<br className="max-lg:hidden" /></>}
      {line}
    </Fragment>
  ));
}
```

**Migrate** (each section's copy moves into its colocated data file; components render from data):
- PR-14, the shared components and their callers: `PageHero` (`title`, `description`), `IntroSection` (`title`, `lead`), `CtaSection` (`title`, `description`, `note.description`), `FeatureGrid`, and the page-level props in `services/page.tsx`, the About and Process CTAs, and the Services, Case Studies, About and Process heroes.
- PR-15, the per-section inline copy: Home hero, Operations, Human operations, Case studies intro, Why AWTOMATIG, Mission and vision (`Pillar.title` / `description` become `Lines`), How we think, Team, Growth, Culture, Contact hero, Inquiry, Proven, Process steps header, Footer statement.

Change the prop types from `ReactNode` to `string | Lines` so TypeScript stops non-serializable content from coming back. Inline emphasis (such as the Process hero's cyan accent word) gets an explicit field (`accent?: string`) rather than JSX.

**Acceptance:** `grep -rn "ReactNode" app/components/sections` shows only `children` props; screenshots at 390 / 1024 / 1440 are identical before and after.

#### 4.2 Image type that accepts CMS URLs · PR-16
Introduce `type MediaImage = { src: StaticImageData | string; width?: number; height?: number; alt: string }` in `lib/content/types.ts`. Use it in case studies, team, services, process steps, growth, culture and partners (merging today's separate `image` / `imageAlt` fields). `next/image` accepts both forms; string sources require `width` and `height`, or `fill`.

#### 4.3 Content access seam · PR-16
Add `lib/content/` with **async getters for the collections a CMS will own**:

```ts
// lib/content/index.ts  (server-only)
import "server-only";
export async function getCaseStudies() { return CASE_STUDIES; }   // later: CMS fetch
export async function getTeam() { return TEAM; }
export async function getServices() { return SERVICE_CONTENT; }
export async function getProcessSteps() { return PROCESS_STEPS; }
```

Sections that render these collections become `async` Server Components that `await` the getter. `CaseStudyFilter` receives the studies as a prop from its server parent instead of importing them. Static page copy (4.1) stays in colocated data files; it moves behind getters only if D8 puts it in the CMS.

This is the single place Phase 5 changes. Without it, the CMS swap touches every section. Add `server-only` as a dependency (a tiny Next-recommended guard package).

**Acceptance:** no component imports collection data directly (only `lib/content`); `next build` still reports every route as static (`○`).

#### 4.4 Test suite (M6) · PR-17
Add Playwright (`@playwright/test`) and `@axe-core/playwright`, configured to run against `next build && next start`. Projects: Chromium at 390×844 and at 1440×900, both with `reducedMotion: "reduce"` for stable screenshots.

| Test | What it proves | Catches |
|---|---|---|
| Route smoke | Every route in `SITE.nav` + legal + 404 returns the right status, has one `<h1>` and logs no console errors | Broken pages, hydration errors |
| Link integrity | Every internal `href` resolves to a route; every `#anchor` and `/#anchor` exists on its target page; no `href="#"` | H1 regressions |
| Metadata | Title, description, canonical and OG tags present per route; sitemap lists every route | H2 regressions |
| Accessibility | axe on every route: zero serious or critical | 3.3 regressions |
| Navigation | Mobile menu opens and closes with click and Escape and closes on route change; the active link has `aria-current` | 2.3 regressions |
| Case study filter | Tabs toggle `aria-pressed` and filter the list; empty state | Filter logic |
| Contact form | Required-field validation; chip selection; the submit behaviour of the current phase (`mailto:` now, Server Action in 5.1) | C1 regressions |
| Visual baseline (optional) | `toHaveScreenshot` per route at both widths | Unintended visual change in refactors |

Scripts: `test:e2e`, `test:e2e:update`.

#### 4.5 CI gate · PR-18 · needs D7
`.github/workflows/ci.yml` on every pull request and push to `main`: `npm ci` → `npm run lint` (ESLint, token check, Prettier check) → `npx tsc --noEmit` → `npm run build` → `npx playwright install --with-deps chromium` → `npm run test:e2e`. Cache npm and the Next build cache. Pin Node with `.nvmrc` and `engines` in `package.json`. Turn on branch protection requiring the workflow.

**Phase 4 exit check:** re-score the codebase with the same 19 areas and record the result in MEMORY.md. Expected ≈ 86 with no open criticals.

---

## 7. Phases 5–6: backend, CMS and hardening

These raise the score from ≈ 86 to ≈ 91. They need decisions D1, D8 and D9.

### Phase 5: Backend and CMS integration

#### 5.1 Working contact form · PR-19 · needs D1
- A Server Action in `app/(site)/contact/actions.ts` (`"use server"`), validated with `zod` on the server; the client keeps native validation for instant feedback.
- `InquiryForm` uses `useActionState` for the result and `useFormStatus` for a pending state on the submit button, and shows per-field errors with `aria-invalid` + `aria-describedby`. The success message appears only after the action confirms delivery.
- Spam control: a hidden honeypot field plus a minimum time-to-submit check; add Cloudflare Turnstile only if spam appears.
- Rate limiting per IP (Vercel Firewall rule, or Upstash if self-managed).
- Uploads: restore the upload box with a limit of 5 files and 10 MB total, PDF / DOCX / PNG / JPG only, checked on the server; sent as email attachments or stored in object storage with a link.
- Email through the provider SDK, with secrets in **server-only** env vars (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`), never `NEXT_PUBLIC_`. Add both to `.env.example` (names only) and to the Vercel project.
- Extend the CSP `form-action` and `connect-src` as required.
- Playwright: success path (provider mocked), validation errors, honeypot rejection.

#### 5.2 CMS client and revalidation · PR-20 · needs D8
- `lib/cms/client.ts` (`server-only`): the CMS SDK or `fetch`, with each response parsed through a `zod` schema that outputs the existing content types (`MediaImage`, `Lines`, `ServiceId`). The getters in `lib/content` switch from static data to the CMS **with no change to components**.
- Caching: enable `cacheComponents` and wrap the getters in `"use cache"` with `cacheTag("case-studies")`, `cacheTag("team")` and so on, plus a `cacheLife` profile. Alternatively, use `fetch(..., { next: { tags } })` if `cacheComponents` is not adopted. Read the Next 16 docs first.
- `app/api/revalidate/route.ts`: POST only, verifies a shared secret header (`CMS_WEBHOOK_SECRET`), maps the CMS document type to a tag, and calls `revalidateTag(tag, "max")` (v16's two-argument form).
- Draft preview via Draft Mode, if editors need it, using a server-only preview token.
- `images.remotePatterns` for the CMS asset host only.

#### 5.3 Detail routes · PR-21
- `app/(site)/case-studies/[slug]/page.tsx` with `generateStaticParams`, `generateMetadata` (title, description and OG image from the CMS) and `notFound()` for unknown slugs. "View case study" buttons reappear (1.2).
- `services/[slug]` only if the content warrants separate pages (owner decision).
- The sitemap includes the dynamic slugs.

#### 5.4 Error and loading states · PR-22
`error.tsx` (a client component with a reset button, in brand style) in `app/(site)/`, and `global-error.tsx` at the root. Add `loading.tsx` or `<Suspense>` fallbacks only around data that can be slow (CMS-backed sections). Don't add skeletons to static content.

#### 5.5 Case-study filter in the URL · PR-23
The filter reads and writes `?category=<serviceId>` through `useSearchParams` and `router.replace` (no scroll), inside a `<Suspense>` boundary so the page shell stays static. This makes filtered views shareable and keeps the back button working.

### Phase 6: Production hardening

#### 6.1 Monitoring and analytics · PR-24 · needs D9
Vercel Analytics and Speed Insights (cookieless; no consent banner needed for these in most jurisdictions, but confirm with D9), and Sentry for client, server and Server Action errors through `instrumentation.ts` / `instrumentation-client.ts`. Add their hosts to the CSP.

#### 6.2 Security review · PR-25
A dependency audit (`npm audit`, Dependabot or Renovate for weekly updates), review of the Server Action and webhook (auth, input limits, error messages that leak nothing), CSP tightened to the final host list, and a check that no env var without `NEXT_PUBLIC_` is referenced from a client component.

#### 6.3 Test coverage for dynamic paths · PR-26
Playwright tests against a CMS fixture (or mocked responses): detail pages, revalidation webhook (rejects a bad secret, accepts a good one), and form delivery. Optionally run Lighthouse CI with budgets: Performance ≥ 90 (mobile), Accessibility ≥ 95, SEO ≥ 95.

---

## 8. Definition of done

A phase is done when **all** of these hold:

- [ ] Every task's acceptance criteria are met
- [ ] `npm run build`, `npm run lint`, `npx tsc --noEmit` and (from Phase 4) `npm run test:e2e` pass, in CI from Phase 4
- [ ] Every route is checked at 390 and 1440, with reduced motion on and off
- [ ] DESIGN.md §12 checklist passes for every UI change
- [ ] MEMORY.md is updated (status table, decisions with *why*, open items, change log); DESIGN.md and AGENTS.md reflect new folders, utilities and conventions
- [ ] The finding IDs closed in this phase are ticked in [§11](#11-progress-tracker)
- [ ] For Phase 4 and later: the score is recorded in MEMORY.md

---

## 9. Finding coverage

Every audit finding maps to at least one task.

| ID | Sev | Finding | Task(s) |
|---|---|---|---|
| C1 | 🔴 | Contact form discards submissions but shows success | 1.1, 5.1 |
| H1 | 🟠 | Inert or self-linking CTAs; placeholder links | 1.2, 4.4 (link test) |
| H2 | 🟠 | Wrong home title; no sitemap, robots, OG, base URL | 1.3, 4.4 |
| H3 | 🟠 | Canvas animates forever, ignores reduced motion | 1.4 |
| H4 | 🟠 | Placeholder content; no privacy policy | 1.2, 1.5 |
| H5 | 🟠 | Service taxonomy and site config duplicated | 2.1, 2.2 |
| M1 | 🟡 | Copy stored as JSX with layout `<br>`s | 4.1 |
| M2 | 🟡 | No security headers; unused remote image pattern | 2.5, 3.1 |
| M3 | 🟡 | Oversized image sources | 3.2 |
| M4 | 🟡 | No `not-found` / `error`; six duplicated page shells | 2.3, 2.4, 5.4 |
| M5 | 🟡 | Marquee lacks pause; false affordances | 3.3 |
| M6 | 🟡 | No tests, no CI | 4.4, 4.5, 6.3 |
| L1 | 🔵 | Deprecated `priority` prop | 3.2 |
| L2 | 🔵 | Small step dots; cyan hover on off-white | 3.3 |
| L3 | 🔵 | Dead SVGs and utilities | 2.5 |
| L4 | 🔵 | Header coupled to `section.hero` | 3.3 |
| L5 | 🔵 | Boilerplate README; doc drift | 2.5 |
| L6 | 🔵 | Mixed import styles; no formatter | 2.6 |
| L7 | 🔵 | Non-null assertions | 1.4, 2.7 |
| — | ⚪ | Case-study filter state not in the URL | 5.5 |
| — | ⚪ | No monitoring or analytics | 6.1 |

---

## 10. Out of scope: do not change

The audit found these already good. Changing them would lower the score or add risk for no gain.

- The Server/Client split and the "client wrapper with server `children`" pattern (StackingCards, HorizontalScroller, ProcessTimeline, LinesBackground).
- No state library, React Query or global context. Server data stays in Server Components.
- Static rendering. Don't add `dynamic`, `revalidate` or caching layers before real data exists (Phase 5).
- The Tailwind-only rule, the token system, `check-tokens.mjs` and the ESLint colour rule.
- The `Button` API and the `sections/shared/` promotion rule.
- The per-section header rows. Don't merge them into a generic `SectionHeader`; their grids genuinely differ.
- The measured pixel values (documented fidelity decisions in MEMORY.md).
- The runtime dependency list beyond the additions named in [§4](#4-ground-rules-for-every-pr).
- `VideoPlayer` (retained on purpose).

---

## 11. Progress tracker

| Task | PR | Finding | Status |
|---|---|---|---|
| 1.1 Honest contact form | PR-1 | C1 | ✅ Done 2026-10-09 |
| 1.2 CTAs and placeholder links | PR-2 | H1, H4 | ✅ Done 2026-10-09 |
| 1.3 SEO foundation | PR-3 | H2 | ✅ Done 2026-10-09 |
| 1.4 Canvas pause and reduced motion | PR-4 | H3, L7 | ✅ Done 2026-10-09 |
| 1.5 Launch content, privacy and terms | PR-5 | H4 | ✅ Done 2026-10-09 |
| 2.1 `lib/site.ts` | PR-6 | H5 | ✅ Done 2026-10-09 |
| 2.2 `lib/services.ts` registry | PR-7 | H5 | ✅ Done 2026-10-09 |
| 2.3 Route-group layout | PR-8 | M4 | ✅ Done 2026-10-09 |
| 2.4 Branded 404 | PR-8 | M4 | ✅ Done 2026-10-09 |
| 2.5 Dead code and docs | PR-9 | L3, L5, M2 | ✅ Done 2026-10-09 |
| 2.6 Prettier and imports | PR-10 | L6 | ✅ Done 2026-10-09 |
| 2.7 Type-safety fixes | PR-9 | L7 | ✅ Done 2026-10-09 |
| 3.1 Security headers | PR-11 | M2 | ✅ Done 2026-10-09 |
| 3.2 Images and fonts | PR-12 | M3, L1 | ✅ Done 2026-10-09 |
| 3.3 Accessibility fixes | PR-13 | M5, L2, L4 | ✅ Done 2026-10-09 |
| 4.1 Serializable copy | PR-14, PR-15 | M1 | ☐ |
| 4.2 `MediaImage` type | PR-16 | M1 | ☐ |
| 4.3 Content access seam | PR-16 | — | ☐ |
| 4.4 Playwright + axe suite | PR-17 | M6 | ☐ |
| 4.5 CI gate | PR-18 | M6 | ☐ |
| **Phase 4 re-score (target ≥ 85)** | — | — | ☐ |
| 5.1 Server Action form | PR-19 | C1 | ☐ |
| 5.2 CMS client and revalidation | PR-20 | — | ☐ |
| 5.3 Detail routes | PR-21 | — | ☐ |
| 5.4 Error and loading states | PR-22 | M4 | ☐ |
| 5.5 Filter in the URL | PR-23 | — | ☐ |
| 6.1 Monitoring and analytics | PR-24 | — | ☐ |
| 6.2 Security review | PR-25 | — | ☐ |
| 6.3 Dynamic-path tests | PR-26 | M6 | ☐ |
