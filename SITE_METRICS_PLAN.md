# Site metrics (trust numbers) CMS: plan

Status: **built and checked on the dev stack (2026-11-05); migration and seed are on the dev database; the VPS release is not done.** Owner answers applied: Systems delivered is 25+ everywhere, retention is 95%, ratings are 4.8 each, stat cards are never hidden. It spans all three folders, so it lives at the root. It is the third piece of the website CMS and copies the Testimonials CMS ([TESTIMONIALS_PLAN.md](TESTIMONIALS_PLAN.md)) wherever it can. When a phase ships, record it in each folder's `MEMORY.md`, add one line to the root `MEMORY.md`, then tick the phase here.

What it does: employees edit the trust numbers shown across the website ("5+ years", "50+ businesses supported", the 4.8 ratings and so on) in the admin app. Each number is shown in the admin with its **field title** and the **pages (and sections) where it appears**, so nobody changes a figure without knowing where it goes live.

Folder docs to read before each phase: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), [backend/RULES.md](backend/RULES.md), [admin/DESIGN.md](admin/DESIGN.md), [frontend/DESIGN.md](frontend/DESIGN.md), `backend/src/modules/cms/README.md`.

---

## 1. What I mapped (every number on the website today)

Searched all of `frontend/app` and `frontend/lib` for counters, percentages, ratings and "N years / clients / days" copy. Everything that is a trust or proof figure is below.

### 1.1 Trust numbers (to become editable)

| # | Figure now | Where it is defined (code) | Shown on (page → section) |
| --- | --- | --- | --- |
| M1 | **5+** Years of experience | `shared/proven/proven.ts` (`PROVEN_STATS`) and `campaign/cleaning.ts` (`CLEANING_STATS`) | **Contact** → "Why AWTOMATIG" stat cards; **Cleaning landing** (`/cleaning-company-solutions`) → Trust / Proof |
| M2 | **50+** Businesses supported | `proven.ts`, `cleaning.ts` **and** `home/trusted-operations/trustedOperations.ts` (`RESULTS`) | **Contact** → Why AWTOMATIG; **Cleaning landing** → Trust / Proof; **Home** → Trusted operations, results card |
| M3 | **95+** Client retention rate | `proven.ts`, `cleaning.ts` | **Contact** → Why AWTOMATIG; **Cleaning landing** → Trust / Proof |
| M4 | **25+** Systems delivered | `proven.ts`, `cleaning.ts` | **Contact** → Why AWTOMATIG; **Cleaning landing** → Trust / Proof |
| M5 | **120+** Systems & Workflows delivered | `trustedOperations.ts` | **Home** → Trusted operations, results card |
| M6 | **75+** Projects Completed | `trustedOperations.ts` | **Home** → Trusted operations, results card |
| M7 | **35+** Client systems supported | `home/trusted-operations/ClientSystemsCard.tsx` (typed straight into the JSX) | **Home** → Trusted operations, dark card |
| M8 | **4.8** Google rating | `home/hero/RatingBadges.tsx` (one `RATING` constant) | **Home** → Hero badges; **Cleaning landing** → Hero badges |
| M9 | **4.8** Clutch rating | same constant | same two places |
| M10 | **4.8** Fiverr rating | same constant | same two places |

Pages with **no** trust numbers: About, Services (and service detail), Process, Case Studies list, Careers, Privacy, Terms.

### 1.2 Numbers that look similar but are NOT in scope

| Figure | Where | Why left out |
| --- | --- | --- |
| Four results per case study ("XX" style stats) | Each case study, `stats` field | **Already editable in the admin** (Website → Case Studies). Shown on Home, Case Studies, the campaign page and the detail pages. No work needed. |
| 18 / 06 / 08 (CRM tasks, QA checks, Campaigns) | `home/human-operations/humanOperations.ts` | Section is **hidden** (commented out in `app/(site)/page.tsx`). Revisit if it comes back. |
| "Typically within 1 business day" | `shared/inquiry/inquiry.ts`, `inquiryEmail.ts`, both form success messages (4 places) | A promise, not a metric, and it is also in emails. Offered as an optional later step (Phase 5). |
| 01 to 04 numbering, process step numbers, "about ten minutes" on the application form | Various | Layout / instructions, not proof. |
| Star count, dates, prices (`BUDGETS`), map coordinates | Various | Not metrics. |

### 1.3 Problems the mapping found (need your call, section 3)

1. **The same claim has different numbers on different pages.** "Systems delivered" is **25+** on Contact and the campaign page but **120+** ("Systems & Workflows delivered") on Home. "Businesses supported" is 50+ everywhere, but it is typed in three separate files, so one edit can leave the others stale. This is the main reason to centralise.
2. **"Client retention rate: 95+"** reads as "95 plus" with no unit. It almost certainly means **95%**. The campaign file says these figures are "owner-verified", but the unit is missing.
3. **All three ratings share one constant (4.8).** Google, Clutch and Fiverr will not stay equal; each needs its own value.
4. The code comments still say these figures were "copied from the Figma mockup; confirm with the owner" (`trustedOperations.ts`, `proven.ts`). Editing from the admin is the moment to confirm them.

## 2. Decisions and assumptions (tell me if any is wrong)

| # | Decision | Why |
| --- | --- | --- |
| 1 | **A fixed set of metric slots, not a free list.** The ten slots in 1.1 are created by a migration/seed. The admin can **edit** them but not add or delete. | Each slot is wired to a specific place in the page code. A "new" slot with no place to show would do nothing. New slot = a code change plus a seed. |
| 2 | **One slot, one value, many places.** M2 (Businesses supported) is a single value used by Contact, the campaign page and Home. | Fixes problem 1: change it once, it changes everywhere it is shown. |
| 3 | **Only the figure is editable in v1.** Labels ("Years of experience") and the short descriptions under them stay in code. | They are page copy (the campaign page has its own sector wording), the same call as the testimonials heading (TESTIMONIALS_PLAN decision 14). Open question Q3 if you want them editable too. |
| 4 | **Count-up format:** a stat value is whole digits plus an optional suffix: `5+`, `95%`, `120+`, `12k`. Validated on the server with `^\d{1,5}(\+\|%\|k\|k\+\|M\|M\+)?$`. | The website's `CountUp` animates `^(\D*)(\d+)(\D*)$`; "4.5+" or "lots" would break the animation or show text. |
| 5 | **Ratings are a second kind:** a number from 0 to 5 with one decimal (`4.8`). Stored as text `"4.8"`, validated 0.0 to 5.0. | Drives the filled stars (4.8 shows 80% of the last star), so it must be a real number. |
| 6 | **No draft / publish step.** Saving goes live (refresh at once). The previous value is kept in the audit log (old and new value, no personal data). | A number is not a page; draft states add friction. The audit log is the undo trail. |
| 7 | **The admin shows the title and the pages, as you asked.** The backend holds a **catalog** (code constant): per slot a field title, a kind (stat or rating), the format hint and the list of placements `{ page, route, section }`. The API returns the catalog merged with the saved values; the admin renders it and never hard-codes page names. | The admin stays free of knowledge about the website. The catalog is typed into the OpenAPI spec like everything else. |
| 8 | **Keeping the catalog true:** a rule in `frontend/RULES.md`: "a new place that shows a metric must add its placement to the backend catalog in the same change." | The catalog can drift from the real pages; the rule and the review checklist are the guard. |
| 9 | **Same delivery as case studies and testimonials:** a public read endpoint (no key), the website reads it server to server with `revalidate` 30/60 s plus a cache tag `site-metrics`, and the backend calls `POST /api/revalidate?tag=site-metrics` after a save. | Reuses the tested path (S7, S8). The browser never calls the backend; no CSP change. |
| 10 | **If the backend is down:** keep the last good values; if there are none (fresh server start), fall back to the **current figures in code** so no card goes blank. | Hiding a stat card would reshuffle the layout; a stale-but-correct-last-time number is the lesser harm. Question Q4. |
| 11 | **Permissions:** `cms.metric.read` and `cms.metric.update`. The seeded `admin` role holds `*`. | Same pattern as the other CMS pieces. |
| 12 | **No structured data from these numbers.** | Frontend rule: invented or unverifiable rating markup risks a Google penalty. Ratings stay visual only. |
| 13 | **Display order stays in code.** | The cards' order is part of the design. |
| 14 | **Nothing is shown differently if a slot is empty:** the proven-stats rule stays ("a card is shown only once it has a real figure"). A slot cannot be saved empty in v1. | Keeps the existing rule without a new "hide" feature. |

## 3. Open questions

| # | Question | My default |
| --- | --- | --- |
| Q1 | **Systems delivered: 25+ or 120+?** Home says 120+ ("Systems & Workflows delivered"), Contact and the campaign page say 25+. Are they two different things, or should one number win? | Two separate slots (M4 and M5) as today, each editable, with a note in the admin. |
| Q2 | **Client retention "95+"**: should it read **95%**? | Seed it as `95%` and fix the card. (Today it shows "95+".) |
| Q3 | Should the **labels and descriptions** under each figure also be editable in the admin? | No (decision 3). |
| Q4 | When the backend is down on a fresh start, show the **built-in figures** or **hide the stat section**? | Show the built-in figures (decision 10). |
| Q5 | Are **4.8 Google / 4.8 Clutch / 4.8 Fiverr** the real current ratings? | Seed all three at 4.8 and let you set each one. |
| Q6 | Add "within 1 business day" (and its 4 places) as a metric later? | Not in v1; Phase 5 if wanted. |

## 4. Architecture

```
Employee browser ─► admin (Website → Site Metrics) ─► backend cms module (session cookie)
                                                          │  validates, saves value, writes audit entry
                                                          └──► PostgreSQL schema `cms`, table site_metrics
Website server (revalidate + tag site-metrics) ──► backend GET /api/v1/cms/public/site-metrics   (no key)
Backend ──► website  POST /api/revalidate?tag=site-metrics   (shared key, after a save)
```

## 5. Data model and API

**Table `cms.site_metrics`** (migration `0006_cms_site_metrics`):

| Column | Notes |
| --- | --- |
| `key` | primary key, text (`years_experience`, `businesses_supported`, `google_rating`, ...) |
| `value` | text, check 1 to 12 chars; the format check by kind lives in the domain layer (zod), because the kind is in the catalog |
| `updated_at`, `updated_by` | as every business table |

Seeded with the ten current values (owner answers to Q1, Q2 and Q5 applied). The catalog (title, kind, placements) is a backend code constant, not a table.

**Catalog entry (what the admin shows):** `key`, `title` (the field title, e.g. "Businesses supported"), `kind` (`stat` or `rating`), `hint` (e.g. "Whole number with an optional + or %"), `placements: [{ page: "Home", route: "/", section: "Trusted operations, results card" }, ...]`.

| Call | Permission | What |
| --- | --- | --- |
| `GET /api/v1/cms/site-metrics` | read | Every slot: catalog entry + current value + last updated by/at. |
| `PATCH /api/v1/cms/site-metrics/:key` | update | Sets the value. 404 for an unknown key, 400 for a value that fails the kind's format. Audit: `cms.site_metric.updated` with key, old value, new value. Triggers the website refresh. |
| `GET /api/v1/cms/public/site-metrics` | none | `{ "businesses_supported": "50+", "google_rating": "4.8", ... }` for the website. |

## 6. Admin screens (Website → Site Metrics)

- **List:** one table, columns **Field** (title), **Value**, **Shown on** (page chips, e.g. "Home", "Contact", "Cleaning landing"), **Last updated**. Grouped under "Statistics" and "Ratings".
- **Edit (dialog or page):** the field title as the heading, the value input with the format hint, a read-only **"Appears on"** list (Page → section, each with an "Open page" link to the live URL), and a note when a value is shared ("Changing this updates 3 places"). Save shows the previous value in the confirmation.
- Validation message matches the format rule; Save is disabled until the value is valid and changed.

## 7. Website changes (frontend)

- `lib/siteMetrics.ts` (like `lib/testimonials.ts`): fetch, tag `site-metrics`, last-good cache, built-in fallback.
- `ProvenSection`: default `stats` read from the metrics (labels/descriptions stay in `proven.ts`); `CLEANING_STATS` takes only its values from the metrics.
- `TrustedOperationsSection`: `ResultsCard` and `ClientSystemsCard` take their values from the metrics (the `35+` leaves the JSX).
- `RatingBadges`: one rating per platform instead of the shared constant.
- `app/api/revalidate/route.ts`: add `site-metrics` to the tag allow-list.
- Because `ProvenSection` and `RatingBadges` are Server Components, they become `async` or receive the values from the page; the `CountUp` client component does not change.

## 8. Phases

Tick a box when it is done and verified.

### Phase 0: owner answers (no code)

- [x] Answered 2026-11-05: Q1 25+ everywhere (so M5 is merged into M4: nine slots, not ten), Q2 95%, Q4 never hide the stat cards, Q5 all three ratings are 4.8. Q3 and Q6 stay no.

### Phase 1: backend

- [x] `schema.ts`: `cms.site_metrics`; `npm run db:generate`; read the SQL.
- [x] Domain: catalog constant, per-kind zod format (stat / rating), pure functions. Repo, service, controller (list, patch, public). Permissions, audit, register in `CmsModule`, `WebsiteRevalidator.siteMetricsChanged()` (`?tag=site-metrics`). Regenerate `openapi.json`.
- [x] Seed: `npm run seed:site-metrics` from `backend/seed/site-metrics.sql` (safe to repeat; never overwrites an edited value).
- [x] Tests: domain format (accepts `5+`, `95%`, `4.8`; rejects `4.5+`, empty, `lots`, rating `5.1`), e2e access (401, 403), unknown key 404, patch changes only that key, audit holds old and new value, public endpoint shape, every catalog key has a seeded row.

### Phase 2: admin

- [x] Website → Site Metrics list and edit, as in section 6. Regenerate the API types (`npm run api:generate`).
- [ ] Browser run of the admin dialog (not done; the API calls behind it were driven for real).

### Phase 3: website

- [x] Section 7 (checked on the dev stack: values on all three pages, an edit shown at once, backend-down fallback by code; a production-server run, a card-by-card HTML compare and a look at 1440 and 390 were not done). Check: the pages' HTML is **identical to today** with the seeded values (compare card by card, as for testimonials); an edit in the admin shows on Home, Contact and the campaign page within one request; backend down keeps the last values; a fresh start with the backend down shows the built-in figures; look at 1440 and 390.

### Phase 4: release and docs

- [x] Decisions: S9 (root `ARCHITECTURE.md`), B18 (backend), AD13 (admin), D67 (frontend); the placement rule in `frontend/RULES.md`; the "confirm with the owner" comments in `proven.ts` and `trustedOperations.ts` replaced; each folder's `MEMORY.md` and one root line.
- [ ] VPS: migration `0006` (the deploy script runs it), `npm run seed:site-metrics` once, no new env var (reuses `CRM_API_URL`, `WEBSITE_URL`, the shared key).

### Phase 5 (optional): more promises as metrics

- [ ] "Typically within 1 business day" as a text-kind slot used by the inquiry card, both form success messages and the confirmation email.
- [ ] Editable labels and descriptions (Q3) if you want them.

## 9. Risks

- **A stat card shows the wrong thing** if the catalog and the pages drift: the placement rule (decision 8) and a Phase 3 check that lists every `CountUp` use against the catalog.
- **The count-up animation breaks** on a value with a decimal or words: blocked by the server-side format (decision 4).
- **A wrong number goes live instantly** (no draft): the audit trail shows who and the old value; the dialog shows the old value before saving.
