# FAQ CMS: plan

Status: **Phases 1 to 3 built and checked 2026-11-05 (backend, admin, website); the six FAQs are seeded on the dev database. Release (Phase 4) and more pages (Phase 5) are not done.** Revised the same day after the owner's answer to Q1.

What it does: employees add, edit, reorder, publish and delete **one shared list of FAQs** in the admin app (Website → FAQs). Every page that shows the shared FAQ section displays that same list: the Contact page today, and the Home page or any other page when we place the section there. A change shows on the live pages within seconds, with no deploy.

**The cleaning landing page (`/cleaning-company-solutions`) is not part of this.** Its FAQ section, questions and answers stay in code exactly as they are.

Folder docs to read before each phase: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), [backend/RULES.md](backend/RULES.md), [admin/DESIGN.md](admin/DESIGN.md), [frontend/DESIGN.md](frontend/DESIGN.md), `backend/src/modules/cms/README.md`.

---

## 1. What exists today

| Where | What | Code |
| --- | --- | --- |
| **Contact** (`/contact`) | `<FaqSection />` with the default heading ("Before we get started."), the dark "Still have some questions left?" card and 6 questions. Only answer 1 is from the design; answers 2 to 6 are drafts. **This becomes admin-controlled.** | `sections/shared/faq/faq.ts` (`FAQS`) |
| **Cleaning landing** | The same `FaqSection`, passed its own heading, card and 6 cleaning questions. **Unchanged: stays hard-coded.** | `sections/campaign/cleaning.ts` (`CLEANING_FAQS`) |
| Home and other pages | No FAQ section today. | |

`FaqSection` and `FaqList` already take `items`. The landing page keeps passing its own `items`, so it needs no change at all.

## 2. Decisions and assumptions (tell me if any is wrong)

| # | Decision | Why |
| --- | --- | --- |
| 1 | **One FAQ list, one admin screen.** No per-question "show on" choice and no page catalog. Every page that uses the CMS-backed section shows the whole published list. | Matches the owner's answer: one list, shown wherever we add the section. Simpler data and screens than the earlier per-page idea. |
| 2 | **The CMS-backed section is opt-in per page, in code.** `FaqSection` gets a way to load the shared list (default for pages that do not pass `items`); the landing page passes its own `items` and so never touches the CMS. Adding FAQs to Home later is one line placing the section. | The landing page must stay as it is. A page that wants the shared list just renders the section. |
| 3 | **Fields:** `question` (1 to 200 characters), `answer` (1 to 1000 characters, plain text, line breaks kept), `status` (`draft` / `published`), `sort_order`. | The accordion shows the answer as one paragraph, so rich text would need new markup and escaping rules. Plain text keeps the design and is safe. |
| 4 | **Heading, eyebrow and the dark side card stay in code, per page.** | They are page copy (same call as the testimonials heading). A page can pass its own heading while still showing the shared list. |
| 5 | **Draft and publish.** Only published FAQs reach the website. Delete is allowed in any state, with a confirmation. | A new answer can be checked before it goes live. No consent issue, so no "drafts only" delete rule. |
| 6 | **Order is manual** (move up / down, saved as one complete list). | Same as case studies and testimonials. |
| 7 | **Same delivery as testimonials (S7, S8, S9):** public read endpoint, no key, the website reads it server to server with `CRM_API_URL`, `revalidate` 60 plus the cache tag `faqs`, and the backend calls `POST /api/revalidate?tag=faqs` after a change that affects the live site. | Reuses the tested path. The browser never calls the backend; no CSP change. |
| 8 | **If the backend is down:** keep the last good list; with none (fresh start), fall back to the built-in `FAQS` in code. | The section is never empty because of an outage. |
| 9 | **If nothing is published:** the section is hidden on the pages that use the shared list. | An empty accordion with a "questions left?" card looks broken. |
| 10 | **Permissions** `cms.faq.read` / `.create` / `.update` / `.delete`. The seeded `admin` role holds `*`. | Same pattern as the other CMS pieces. |
| 11 | **Audit** entries hold the id and the names of changed fields only, not the question or answer text. | Same as testimonials. |
| 12 | **No `FAQPage` structured data.** | Google limits FAQ rich results to a few site types, and the frontend rules forbid markup that risks a penalty. |
| 13 | **Public endpoint cap: 100 FAQs.** | A bound on page size and on the accordion. |
| 14 | **Seed:** `npm run seed:faqs` loads today's six Contact questions from `backend/seed/faqs.sql` (fixed ids, `ON CONFLICT DO NOTHING`, never overwrites an edit), so the first deploy changes nothing on Contact. The cleaning questions are **not** seeded. | Same as `seed:testimonials`. |

## 3. Open questions

| # | Question | My default |
| --- | --- | --- |
| Q1 | ~~One list or per-page?~~ **Answered 2026-11-05:** one list on every page that has the shared FAQ section; the landing page stays as it is. | Applied above. |
| Q2 | Are Contact answers 2 to 6 (drafts since the start) confirmed by the owner? | Seed them as published; confirm or edit them in the admin after the release. |
| Q3 | **Add the FAQ section to Home now, or only later?** And where on Home (for example after Why AWTOMATIG / before the CTA)? | Build only the mechanism and Contact now; add Home in a separate small step once you say where it goes. Phase 5. |
| Q4 | Allow links inside answers? | No in v1 (plain text). |
| Q5 | Should headings and the side card be editable? | No (decision 4). |

## 4. Architecture

```
Employee browser ─► admin (Website → FAQs) ─► backend cms module (session cookie)
                                                   │  validates, saves, writes audit entry
                                                   └──► PostgreSQL schema `cms`, table faqs
Website server (revalidate 60 + tag faqs) ──► backend GET /api/v1/cms/public/faqs   (no key)
Backend ──► website  POST /api/revalidate?tag=faqs   (shared key, after a live change)
```

## 5. Data model and API

**Table `cms.faqs`** (migration `0007_cms_faqs`, additive; the `cms` schema already exists):

| Column | Notes |
| --- | --- |
| `id` | UUIDv7 primary key |
| `question` | text, check 1 to 200 characters |
| `answer` | text, check 1 to 1000 characters |
| `status` | `draft` / `published` (check) |
| `sort_order` | integer, index on `(status, sort_order)` |
| `published_at`, `created_at`, `updated_at`, `created_by`, `updated_by` | as every business table |

| Call | Permission | What |
| --- | --- | --- |
| `GET /api/v1/cms/faqs` | read | List (status filter, search on question or answer, page). |
| `POST /api/v1/cms/faqs` | create | Creates a draft at the last position. |
| `GET /api/v1/cms/faqs/:id` | read | One FAQ. |
| `PATCH /api/v1/cms/faqs/:id` | update | Edits question or answer. Refreshes the website only if the FAQ is published. |
| `POST /:id/publish`, `POST /:id/unpublish` | update | State change (row locked). 409 if already in that state. |
| `PUT /api/v1/cms/faqs/order` | update | The complete order (every id exactly once), declared before the `:id` routes. |
| `DELETE /api/v1/cms/faqs/:id` | delete | Removes the FAQ in any state. 204. Refreshes the website if it was published. |
| `GET /api/v1/cms/public/faqs` | none | `{ faqs: [{ question, answer }] }`, published only, display order, at most 100. No id, status or audit columns. |

Audit actions: `cms.faq.created`, `.updated`, `.published`, `.unpublished`, `.reordered`, `.deleted`. `WebsiteRevalidator.faqsChanged()` sends `?tag=faqs`.

## 6. Admin screens (Website → FAQs)

- **List:** table with Question, Status, Last updated, move up / down, and actions (Edit, Publish / Unpublish, Delete). Filter by status, search by text. A note above the table: "These FAQs show on every page that has the FAQ section (currently: Contact). The cleaning landing page has its own." The page list in that note is plain text in the admin; update it when a page is added.
- **New / Edit form:** Question and Answer with character counters; the form says the answer is plain text.
- **Dialogs:** Publish, Unpublish and Delete confirmations (the existing shared `Dialog`).
- Reuses the shared move buttons, table, pagination and form primitives from Testimonials and Case Studies. New admin nav item under Website. Regenerate the API types with `npm run api:generate`.

## 7. Website changes (frontend)

- `lib/faqs.ts` (like `lib/testimonials.ts`): fetch with `revalidate: 60` and the tag `faqs`, a runtime shape check, a last-good cache in the server process, and `getFaqs()` returning the published items. If nothing was ever loaded, it returns the built-in `FAQS` (decision 8).
- `FaqSection` becomes an async Server Component. When the page passes `items` (the landing page does) it uses them untouched; otherwise it calls `getFaqs()`, renders nothing if the list is empty (decision 9) and otherwise renders the same markup. `FaqList` (client) is unchanged, except that its list key becomes index plus question so two identical questions cannot collide. Heading, eyebrow and side card props stay as they are.
- Contact: no change to the page file (it already renders `<FaqSection />` with no items).
- `app/api/revalidate/route.ts`: add `faqs` to the allow-list (tag from `lib/faqs.ts`).
- No new dependency, no CSP change.

## 8. Phases

Tick a box when it is done and verified.

### Phase 0: owner answers (no code)

- [x] Q1 answered (one list, landing page unchanged).
- [x] Q2 to Q5: defaults accepted (the owner moved on to Phases 2 and 3). Q2 (confirm Contact answers 2 to 6) is still worth doing in the admin after the release.

### Phase 1: backend

- [x] `schema.ts`: `cms.faqs`; `npm run db:generate`; read the SQL (migration renamed `0007_cms_faqs`).
- [x] Domain (`faq.ts`), repo, service, controller (admin and public), DTOs, permissions, audit, register in `CmsModule`, `WebsiteRevalidator.faqsChanged()`. Regenerate `openapi.json`. Decision B19 and the endpoints in the cms README.
- [x] Seed: `npm run seed:faqs` from `backend/seed/faqs.sql` (the six Contact questions).
- [x] Tests (throwaway PostgreSQL, 471 pass): length limits (200 / 201, 1000 / 1001, empty), e2e access (401, 403, other CMS permissions do not open FAQs), create / edit / publish round trip, state conflicts, reorder rules, delete in any state, public list shape and order with drafts hidden, cap of 100, website refresh only for live changes, audit holds no question or answer text, `%` and `_` in search match literally.

### Phase 2: admin

- [x] List, new and edit form, dialogs, move up / down, nav item. `typecheck`, `lint`, `build` pass. Browser: a scripted run passed 46 of 48 (2 wrong test expectations) and the owner checked the screens themselves. Open: one unexplained 390px page-width reading (admin memory).

### Phase 3: website

- [x] Section 7 (27 of 27 checks on a production build of a copy; not looked at in a browser). Check: with the seed loaded, the Contact FAQ HTML is **identical to today**; the landing page FAQ HTML is **byte-identical and never calls the backend**; an admin edit, publish, unpublish, reorder and delete shows on Contact within one request; backend down keeps the last list; fresh start with the backend down shows the built-in six; nothing published hides the section; look at 1440 and 390.

### Phase 4: release and docs

- [x] Decisions S10 (root `ARCHITECTURE.md`), B19 (backend), AD15 (admin), D68 (frontend); each folder's `MEMORY.md` and one root line.
- [ ] VPS: migration `0007` (the deploy script runs it), `npm run seed:faqs` once, no new env var.

### Phase 5: more pages

- [ ] Place `<FaqSection />` on Home (or another page) once you say where; update the page note in the admin list. Optional later: links inside answers (Q4), editable headings (Q5).

## 9. Risks

- **A page shows FAQs that do not fit it:** every page using the shared list shows the same questions. Fine for general questions; a sector-specific page should pass its own `items`, like the landing page.
- **Unreviewed answers go live in the seed:** Contact answers 2 to 6 were drafts. Q2 asks the owner to confirm them.
- **A wrong answer goes live instantly on publish:** the audit log shows who and when (field names, not text); unpublish is one click.
