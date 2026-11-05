# Testimonials CMS: implementation plan

Status: **Phases 0, 1 and 2 built and tested (2026-11-05); Phase 3 code written and checked by typecheck, lint and build (2026-11-05), the browser run is not done; Phase 4 built and checked (2026-11-05); Phase 5 built (seed done on the dev database), the VPS release is not done.** It spans all three folders, so it lives at the root. It is the second piece of the CMS and copies the Case Study CMS ([CASE_STUDY_PLAN.md](CASE_STUDY_PLAN.md)) wherever it can. When a phase ships, record it in each folder's `MEMORY.md`, add one line to the root `MEMORY.md`, then tick the phase here.

What it does: employees create, edit, publish, unpublish, reorder and delete client testimonials in the admin app, and upload one company logo per testimonial. The "Client testimonials" section on Home and About reads the published ones from the backend instead of the hard-coded list in `frontend/app/components/sections/shared/testimonials/testimonials.ts`.

Folder docs to read before each phase: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), [backend/RULES.md](backend/RULES.md), [admin/DESIGN.md](admin/DESIGN.md), [frontend/DESIGN.md](frontend/DESIGN.md), and `backend/src/modules/cms/README.md`.

---

## 1. What exists today

- **Website:** `shared/testimonials/` has `TestimonialsSection` (header row, static copy), `TestimonialsTrack` (client component: draggable, autoplaying scroller with a scrub bar) and `testimonials.ts` (six quotes with bundled logo imports from `public/images/partners/`). Used by Home (after Why AWTOMATIG) and About (after Culture). Each card shows: a service chip, the quote, the company logo, name, and "role · company". White logos are drawn in black on the white card (`logoOnWhite`).
- **Backend:** a `cms` module with the Case Study CRUD, image upload to the public R2 bucket, public read endpoints, and a `WebsiteRevalidator` that makes the website drop its cache at once.
- **Admin:** a "Website" nav group with Case Studies (list, form, image picker, move buttons, publish/unpublish/delete dialogs).
- **The six current quotes** (Smith Lake, Objective Focus, Zenithics Global, No Spain No Gain, Sell My Rig, We Watch) came from the owner on 2026-10-20 (frontend memory). Their service chips were assigned from the quote's content, "confirm" is still open there.

## 2. Decisions and assumptions (tell me if any is wrong)

Everything below is my default. The Case Study CMS settled the shared parts, so those are not repeated as questions.

| # | Decision | Why |
| --- | --- | --- |
| 1 | **Same `cms` module, new table `cms.testimonials`, migration `0005_cms_testimonials`.** New files beside the case study ones (controller, dto, domain, repo, service). | One module for the website's managed content (backend B16). No new dependency. |
| 2 | **Fields:** `quote`, `name`, `role`, `company`, `service` (one of the four ids), `logo` (optional), `logo_in_black` (boolean), `consent_confirmed` (boolean), `status`, `sort_order`, `published_at`. | Exactly what a card shows, plus the two flags the card and the law need. |
| 3 | **No slug.** A testimonial has no page. The logo folder is `testimonial/<id>/logo<N>.<ext>` in `awtomatig-public`, named by the row id. | A slug would be an invented rule with a "taken" error for no benefit. The id never changes, so files never move. |
| 4 | **The logo is optional.** Without one, the card shows the company name as text where the logo would be. | A real client may have no usable logo; that must not block publishing. The logo's alt text is the company name (as the site does today), so there is no separate alt field. |
| 5 | **Logo types: PNG, JPEG, WebP only, 5 MB, found from the file bytes.** No SVG. | Reuses the existing, tested image checks. SVG can carry scripts and `next/image` blocks it by default. Recommended: a transparent PNG at least 320 px wide (the card draws it 36 px tall, at most 160 px wide). |
| 6 | **`logo_in_black`** ("Show the logo in black: use for white or very light logos") replaces `logoOnWhite`. Same effect as today (`brightness-0`). | The card is white, so a white logo would be invisible. |
| 7 | **Consent is a required checkbox to publish:** "The client has agreed to this quote being published with their name and company." Stored as `consent_confirmed`; publish returns 400 without it. | A quote with a real person's name and role is personal data on a public page. The Privacy Policy already promises deletion on request, so this records that permission exists. |
| 8 | **Quote length: 1 to 600 characters** (hard limit); the form shows a counter and warns above about 350. | The cards have a fixed width and stretch to the tallest one; very long quotes make every card tall. |
| 9 | **Service is required** and must be one of the four ids (zod and a DB check), as on case studies. | Matches the current design; every card has a chip. |
| 10 | **Order** is `sort_order`; the admin can move a testimonial up or down; new ones go last. Reorder needs every id exactly once (same safety rule as case studies). | Same behaviour the team already knows. |
| 11 | **Delete works on a draft only**, permanent, and removes the logo folder. Unpublish first. | Same as case studies; keeps anything live from vanishing by accident. |
| 12 | **Public endpoint needs no key**, returns an allow-listed shape (no id, status, consent flag or audit columns) and at most 50 testimonials. Drafts never appear. | Published content is public; same as case studies. |
| 13 | **One list for Home and About.** No per-page choice in v1. | Keeps the first version small. A `featured` flag can be added later without breaking anything. |
| 14 | **The section's heading and paragraph stay in code** ("What clients say after the work is done." and the line under it). Only the cards are managed. | It is page copy, owned by the website's copy review, not per-testimonial content. |
| 15 | **If there is nothing to show, the whole section is hidden** (no published testimonials, or the backend is down with nothing cached). | An empty "What clients say" box looks worse than no section. Case studies show empty states because they have a page of their own; this does not. |
| 16 | **Last good list is kept in the website's server process** when the backend is down (same as case studies). | Never lose the section because of a short outage. |
| 17 | **No `Review` / `Person` / rating structured data.** | Already a frontend rule (frontend memory, "Webcopy follow-ups"): invented or unverifiable review markup risks a Google penalty. |
| 18 | **No client photo.** The design replaced the avatar with the company logo (2026-10-20). | Fewer personal images to store and consent for. |
| 19 | **Audit entries hold ids and field names only**, never the quote, name, role or company. | Personal data stays out of the audit log, like leads and applications. |

## 3. Open questions

| # | Question | Default if not answered |
| --- | --- | --- |
All answered by the owner on 2026-11-05.

| # | Question | Answer |
| --- | --- | --- |
| Q1 | Are all six current quotes (and the names, roles, companies) real and approved by the clients? | **Yes.** They are seeded as published. |
| Q2 | A **Featured** flag so Home and About show different sets? | **No.** The pages load the same published list (with logos) from the database. |
| Q3 | A card **preview** in the admin form? | **No.** The logo panel still previews the logo on white. |
| Q4 | **SVG** logo support? | **No.** PNG, JPEG or WebP. |
| Q5 | Should the section's **title and paragraph** ("What clients say after the work is done." and the line under it) be editable in the admin? (Not the per-card service chip, which is always editable.) | **No.** They stay in code (decision 14). |

## 4. Architecture

```
Employee browser ─► admin (Next.js, /api rewrite) ─► backend  cms module (session cookie)
                                                        │   validates, writes row, uploads logo
                                                        ├──► R2 public bucket  testimonial/<id>/logo<N>.<ext>
                                                        └──► PostgreSQL schema `cms`  (table testimonials)

Website server (Next.js, revalidate 60 + tag) ──► backend  GET /api/v1/cms/public/testimonials  (no key)
Backend ──► website  POST /api/revalidate?tag=testimonials  (shared key, after a change that affects the live site)
Visitor browser ──► logo URL on the public bucket, through next/image
```

The browser never calls the backend; logos go through `next/image` from the host in `ASSETS_URL`, so no CSP change is needed. A new decision row **S8** in the root `ARCHITECTURE.md` and **B17** in `backend/ARCHITECTURE.md` are added when the website starts reading it (Phase 4).

## 5. Data model (backend, schema `cms`, migration `0005_cms_testimonials`)

`cms.testimonials`:

| Column | Notes |
| --- | --- |
| `id` | UUIDv7 (base columns) |
| `status` | `draft` or `published` (text + check) |
| `sort_order` | integer |
| `published_at` | set on first publish, kept on unpublish |
| `quote` | text, check length 1 to 600 |
| `name`, `role`, `company` | text, not empty |
| `service` | text, check against the four service ids |
| `consent_confirmed` | boolean, default false |
| `logo_in_black` | boolean, default false |
| `logo_key`, `logo_width`, `logo_height`, `logo_size`, `logo_type` | all null until a logo is uploaded; one check makes them all-or-none |
| `created_at`, `updated_at`, `created_by`, `updated_by` | as every business table |

Checks: status, service, logo columns all-or-none, and **published implies `consent_confirmed`** (database-level backstop for the service rule). Index: `(status, sort_order)`.

## 6. API

Employee endpoints, under `/api/v1/cms/testimonials`. Permissions: `cms.testimonial.read`, `.create`, `.update`, `.delete`. The seeded `admin` role holds `*`.

| Call | Permission | What |
| --- | --- | --- |
| `GET /` | read | Paged list (`page`, `pageSize` up to 100, `status`, `q` on name, company or quote, `sort`, `order`). Default: display order. |
| `GET /:id` | read | One testimonial with its logo URL or `null`. |
| `POST /` | create | Creates a **draft** in the last position. |
| `PATCH /:id` | update | Edits any field, including `consentConfirmed` and `logoInBlack`. |
| `PUT /:id/logo` | update | Uploads or replaces the logo (multipart: one file `logo`). New number, then the old file is deleted. |
| `DELETE /:id/logo` | update | Removes the logo. Allowed on a published testimonial too, because the logo is optional (decision 4); the card then shows the company name. |
| `POST /:id/publish` | update | Draft to published. 409 if not a draft; 400 without consent. |
| `POST /:id/unpublish` | update | Published to draft. 409 if not published. |
| `PUT /order` | update | Sets the display order; `ids` must hold every testimonial exactly once. |
| `DELETE /:id` | delete | Draft only (409 if published). Removes the row and the logo folder. 204. |

Public endpoint, `GET /api/v1/cms/public/testimonials`: published, in order, at most 50, each `{ quote, name, role, company, service, logoInBlack, logo: { url, width, height } | null }`. Never the raw row.

Rules carried over from case studies: state changes lock the row (`select … for update`), reorder locks every row, upload order is "store new file, update row, delete old file" with rollback of the new file on failure, all input is zod-validated, and the website is told to refresh after any change to a published row, a publish, an unpublish or a reorder.

## 7. Phases

Tick a box when it is done and verified.

### Phase 0: make the shared parts shareable (backend + frontend, no behaviour change)

Done as its own change, before any testimonial code, so a refactor is never mixed with a feature (RULES section 1).

- [x] Move the shared parts of the image upload (byte check, storing under the next unused number, discarding a file) out of `CaseStudiesService` into `PublicImageStore` in `cms/service/`. The row update stays in each service because it differs. `domain/image.ts` gained `buildFileKey` and `nextFileNumber`, which take a folder and a file name (`image`, `logo`).
- [x] `WebsiteRevalidator` gained `testimonialsChanged()`, which sends `?tag=testimonials`. `caseStudiesChanged()` keeps sending **no tag**, so the existing behaviour and its tests are untouched.
- [x] Website `app/api/revalidate/route.ts` reads the optional `tag` (allow-list: `case-studies`, `testimonials`; anything else is 400); **no `tag` still means case studies**, so an old backend and a new website (and the reverse) both keep working.
- [x] Admin: check whether `ImagePicker`, `MoveButtons` and the confirm dialogs can be used as they are; move to `components/` only the parts that need no change. (Moved to the start of Phase 3: nothing in Phase 0 needs it.)

Done when: the existing 303 backend tests still pass unchanged (they are the proof nothing moved), plus lint, typecheck, build, and the website revalidate route returns the same answers as before. **Done 2026-11-05:** 305 tests in 17 suites pass against a throwaway PostgreSQL with the database suites running (303 unchanged + 2 new revalidator tests); 2 image-number unit tests were added after that run and pass on their own, which makes 307; the route answers 200 with no tag, `case-studies` and `testimonials`, 400 for an unknown tag and 401 without the key.

### Phase 1: table and CRUD (backend)

- [x] `schema.ts`: `cms.testimonials`; `npm run db:generate`; read the generated SQL (check `CREATE SCHEMA` is not repeated, checks and the index are there).
- [x] `domain/testimonial.ts`: zod schemas, limits, the publish rule (`consentConfirmed`), pure functions.
- [x] Repo, service and controller for list, get, create, patch, publish, unpublish, order, delete (no files yet). Permissions and audit entries (`cms.testimonial.created` / `.updated` / `.published` / `.unpublished` / `.reordered` / `.deleted`).
- [x] Register in `CmsModule`. Regenerate `openapi.json`.
- [x] Tests: unit for the domain; e2e on a throwaway PostgreSQL for access (401, 403), validation (empty fields, too long, bad service), publish needs consent, status rules (409), reorder needs every id, delete only a draft, audit holds no text.

Done when: lint (with the boundary check), typecheck, build and all tests pass. **Done 2026-11-05:** 360 tests in 19 suites pass against a throwaway PostgreSQL (the 307 after Phase 0, plus 17 domain unit tests and 36 e2e tests); the generated SQL for `0005` was read (only `CREATE TABLE` and `CREATE INDEX`); `openapi.json` differs from the committed one only by the testimonial paths and schemas. One rule was added beyond the plan: consent cannot be withdrawn from a published testimonial (409), because the database check would otherwise make that edit a 500. The migration is not yet applied to the owner's dev database.

### Phase 2: logo and public endpoint (backend)

- [x] `PUT /:id/logo` and `DELETE /:id/logo` using the shared helper: type found from bytes, 5 MB, never overwrites, immutable cache header; width and height read from the header.
- [x] Delete removes the whole `testimonial/<id>/` folder.
- [x] Public list endpoint with the allow-listed shape and the 50 cap; draft is absent.
- [x] Tests: upload, replace (new number, old removed), wrong type, fake extension, too big, storage down stores nothing, failed row update removes the new file, remove logo, delete removes files, public shape has no private fields (no id, status, consent), drafts absent.
- [x] Real-bucket check with a temporary script (deleted afterwards): upload, read the public URL, replace, delete, confirm the prefix is empty. Needs the owner's go-ahead because it writes to the real bucket.
- [x] `backend/src/modules/cms/README.md` gains a Testimonials section; decision **B17** added to `backend/ARCHITECTURE.md`.

Done when: tests pass and the real-bucket check passes. **Built 2026-11-05:** 383 tests in 19 suites pass against a throwaway PostgreSQL (the 360 after Phase 1, plus 23 new), lint, typecheck, build; `openapi.json` regenerated. **Real-bucket check and migration `0005` on the dev database: done and confirmed by the owner on 2026-11-05 (the output was not seen by the assistant), so Phase 2 is done.** Two small additions beyond the plan: removing a logo that is not there is a 200 that changes nothing, and the website is refreshed after a logo change on a *published* testimonial.

### Phase 3: admin screens

- [x] `npm run api:generate`.
- [x] Nav: "Testimonials" under the Website group (a quote icon), visible with `cms.testimonial.read`. Update `admin/lib/nav.ts` and `MobileNav` if it keeps its own list.
- [x] List: logo thumbnail, name and company, quote excerpt, service, status, order; row actions Edit, Publish / Unpublish, Delete (draft only); status filter; search; move up / down.
- [x] Form (new and edit): quote with a character counter, name, role, company, service select, the logo panel (upload, preview **on a white card**, replace, remove, the recommended size, "show in black"), and the consent checkbox with its sentence. No card preview (Q3).
- [x] Confirm dialogs for Publish, Unpublish and Delete (Delete names the person and company). Clear errors: consent missing on publish, upload too big or wrong type.
- [x] `admin/DESIGN.md` updated for any new pattern.

Done when: `typecheck`, `lint` and `build` pass, and the whole flow (create, upload, edit, publish, unpublish, reorder, delete) is driven in headless Chrome against the running dev servers, with test data removed afterwards.

**Built 2026-11-05 (not yet marked done):** `typecheck`, `lint` (with the token sync) and `build` pass. The browser run of the whole flow, which is part of "done when" above, was **skipped at the owner's request**, so Phase 3 stays open until it is done or the owner accepts it as is. `ImagePicker` and `MoveButtons` were moved to `admin/components/cms/` and made generic (case studies use them unchanged in behaviour); the confirm dialogs stay per feature because their wording names the thing.

### Phase 4: the website reads from the CMS (frontend)

- [x] `lib/testimonials.ts`: server fetcher (`revalidate: 60`, tag `testimonials`), the same shape check, ASSETS_URL origin check and "last good list" as `lib/caseStudies.ts`. Returns `ok: false` or an empty list so the section can hide itself.
- [x] `Testimonial` type: `logo` becomes `{ src, width, height } | null` (remote, via `next/image`), plus `logoInBlack`. `TestimonialsSection` becomes an async server component that loads the list and passes it to `TestimonialsTrack`; it returns nothing when the list is empty (decision 15).
- [x] Card: logo `<Image>` with `alt` = company, or the company name as text when there is no logo.
- [x] Track polish found while reading it: with only one or two cards the row does not overflow, so the scrub bar and pause button do nothing; hide them when `scrollWidth <= clientWidth`.
- [x] Revalidate route reads `tag=testimonials` (Phase 0 prepared it).
- [x] Home and About check: same order, text and logos as before.
- [x] `frontend/DESIGN.md` and `frontend/MEMORY.md` (D53 line, "testimonials.ts" description) updated; root `ARCHITECTURE.md` gets decision **S8**.

Done when: `tsc`, `lint` and `build` pass, Home and About render from live data against the local backend, an unpublish takes a card off at once and a republish brings it back, and with the backend stopped the section still shows the last good list (and disappears cleanly if nothing was ever loaded). A browser look at 1440, 1024 and 390.

**Built 2026-11-05:** `tsc`, `lint` and `build` pass. On a production server against the local backend and the seeded dev database: Home and About show the six cards identical to the old list (text, order, services, alt text, the two black logos; logos now bucket files), the image optimizer serves a logo, an unpublish took a card off on the next request and a republish brought it back (dev data restored), a backend outage keeps the last good list, and with nothing ever loaded the section is absent on both pages. A look at 1440 and 390 in headless Chrome; no horizontal overflow at 1440, 1024 or 390. **Not seen in a browser:** the 1024 capture itself, a card without a logo (company name in the slot), the one- or two-card case (hidden scrub bar), real dragging and autoplay. `next.config.ts` also had to allow `/testimonial/**` on `ASSETS_URL` for `next/image` (it only allowed `/case-study/**`), which the plan had not listed.

### Phase 5: seed and release

- [x] One-off script (outside the repo, as for case studies) creates the six testimonials through the real API as the seeded admin, uploads their logos (the six files in `frontend/public/images/partners/`) to `testimonial/<id>/logo1.png`, and publishes them in the current order. Needs the owner's go-ahead (writes to the real bucket). Q1 is answered: all six are approved.
- [x] Turn what that created into `backend/seed/testimonials.sql` and `npm run seed:testimonials` (fixed ids, `on conflict do nothing`, safe to repeat), exactly like `seed:case-studies`, so the VPS gets the same rows without re-uploading.
- [x] Compare Home and About before and after (text, order, logos, black logos).
- [x] Remove `testimonials.ts` and its logo imports. **Keep** the PNGs in `public/images/partners/`: `partners.ts` (the logo slider) still uses them.
- [ ] VPS checklist (section 9) done and one real publish verified.

**Built 2026-11-05:** the logos were uploaded and the rows seeded **directly** instead of through the admin API (same result as the case study seed: a one-off script, deleted afterwards, generated the ids, uploaded the six PNGs to `testimonial/<id>/logo1.png` in the real public bucket and wrote `backend/seed/testimonials.sql`; `npm run seed:testimonials` loads it, first run 6 added, second 0). Dev database: the six are published and show on the website. The old `testimonials.ts` was deleted and its imports with it (the PNGs stay for `partners.ts`). **Open:** the VPS checklist (section 9) and one real publish there.

## 8. Verification (every phase)

- Backend: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` against a throwaway PostgreSQL; `openapi.json` current.
- Admin: `npm run typecheck`, `npm run lint`, `npm run build`, plus a browser run of the flow.
- Frontend: `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus a browser look at 1440, 1024 and 390.
- Report what was and was not checked, as in the other changes.

## 9. VPS release checklist

Nothing new is needed in any `.env`: `R2_PUBLIC_*`, `WEBSITE_URL`, `ASSETS_URL` and `LEAD_INGEST_KEY` already exist from the Case Study CMS.

- [ ] **Deploy order:** the website first (it must know the `tag` parameter), then the backend and admin. `deploy.sh` rebuilds changed folders on push; if all three change at once, the worst case is a one-minute delay in refresh, never an error.
- [ ] The migration runs through `deploy.sh`; check `\dt cms.*` shows `testimonials` afterwards.
- [ ] `npm run seed:testimonials` run once in `backend/` on the VPS; Home and About checked on the live site. It assumes the VPS uses the same public bucket as dev (the logo keys are in the SQL).
- [ ] The backend is up, migrated and seeded when the website builds (the build fetches the list).
- [ ] Publish, unpublish, reorder and delete tried once on a test testimonial, then it is removed.

## 10. Docs to update

| Where | What |
| --- | --- |
| `backend/ARCHITECTURE.md` | Decision **B17** (testimonials in the `cms` module; shared image helper). |
| `backend/src/modules/cms/README.md` | Tables, endpoints, rules, permissions, privacy notes for testimonials. |
| `backend/MEMORY.md`, `admin/MEMORY.md`, `frontend/MEMORY.md` | Status rows, decisions, gotchas and a dated change log per phase, with what was verified. |
| Root `MEMORY.md` | One change-log line per phase, naming the folder. |
| Root `ARCHITECTURE.md` | Decision row **S8** once the website reads testimonials. |
| `admin/DESIGN.md`, `frontend/DESIGN.md` | Any new pattern; the website's data file is no longer hard-coded. |
| Privacy Policy (`frontend/`) | One line that published testimonials show a name, role and company with the client's permission, and are removed on request. Needs the owner's wording (the page is still a draft for legal review). |

## 11. Risks and things to watch

- **Real people's names on a public page.** Consent checkbox (decision 7), draft-only delete plus instant unpublish for "remove me" requests. The six existing quotes are confirmed approved (Q1).
- **Logo shapes vary.** The card box is `h-36`, `max-w-160`, `object-contain`, so wide or tall logos stay inside it; very small or low-resolution files look soft. The form shows the recommended size and previews on white.
- **A coloured logo with "show in black" ticked turns fully black**, which is the existing behaviour. The checkbox label says to use it for white or very light logos.
- **Few cards.** One or two cards leave the scroller with nothing to scroll (handled in Phase 4).
- **Build needs the backend.** Home and About already depend on it through case studies; testimonials add no new failure mode, and the section hides itself if the list cannot load.
- **Two admins editing at once.** Row locks on state changes, as in case studies; a plain field edit is last-write-wins, the same as everywhere else in the admin.

## 12. Progress

| Phase | Status | Date |
| --- | --- | --- |
| 0 Shared parts (refactor, no behaviour change) | done and tested | 2026-11-05 |
| 1 Table and CRUD (backend) | done and tested | 2026-11-05 |
| 2 Logo and public endpoint (backend) | done and tested | 2026-11-05 |
| 3 Admin screens | code written; `typecheck`, `lint`, `build` pass; **browser run not done** (skipped by the owner) | 2026-11-05 |
| 4 Website reads from the CMS (frontend) | built and checked on a production server; 1024 capture and the no-logo and few-cards cases not looked at | 2026-11-05 |
| 5 Seed and release | seed done on the dev database and `npm run seed:testimonials` ready; **VPS release not done** | 2026-11-05 |
