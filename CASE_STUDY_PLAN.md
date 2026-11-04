# Case Study CMS: implementation plan

Status: **Phases 0 to 4 built and tested; the Phase 4 browser look at three widths and Phase 5 (release) are pending (2026-11-04).** It spans all three folders, so it lives at the root. This is the first piece of the CMS. When a phase ships, record it in each folder's `MEMORY.md`, add one line to the root `MEMORY.md`, then tick the phase here.

What it does: employees create, edit, publish, unpublish and delete case studies in the admin app, and upload one showcase image per study. The public website (Home "Selected work", the Case Studies page, the campaign page "Relevant work", the sitemap) reads published studies from the backend instead of the hard-coded list in `frontend/app/components/sections/shared/case-studies/caseStudies.ts`.

Folder docs to read before each phase: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), [backend/RULES.md](backend/RULES.md), [admin/DESIGN.md](admin/DESIGN.md), [frontend/DESIGN.md](frontend/DESIGN.md). The pattern to copy is the `recruitment` module ([RECRUITMENT_PLAN.md](RECRUITMENT_PLAN.md), `backend/src/modules/recruitment/README.md`).

---

## 1. Decisions already made (from the owner)

| Topic | Decision |
| --- | --- |
| Image storage | Cloudflare R2 **public** bucket `awtomatig-public`, keys `case-study/<case-study-name>/image1.png`, `image2.png`, and so on. |
| Images per study | **One.** Uploaded once and used on both Home and the Case Studies page (the card shows the same 551×525 picture on both). |
| Actions in the admin | **Edit, Delete, Publish / Unpublish.** |

## 2. Assumptions I made: tell me if any is wrong

1. **Replacing the image** uploads the next number (`image2.png`), saves it on the record, then deletes the old file. A new file name means the CDN never serves a stale picture, and a file is never overwritten.
2. **The extension follows the real file type** (png, jpg or webp, checked by its header bytes, not only its name). Max 5 MB (the existing multipart cap).
3. **The slug is fixed at creation** (the title as a slug, no random suffix: the three existing ids already are slugs, so URLs stay the same). Renaming a title never moves files or breaks a link. A slug that is taken is refused.
4. **A study cannot be published without an image and its alt text.**
5. **Delete works on a draft only.** A published study must be unpublished first, so nothing live disappears by accident. Delete is permanent: it removes the row and every file under `case-study/<slug>/`.
6. **Unpublish takes the study off the site within about a minute** (the website refreshes every 60 seconds): gone from Home and the list, its page returns 404, and it leaves the sitemap.
7. **The image is stored as a plain rectangle.** The website rounds the corners in code (`CASE_STUDY_IMAGE_RADIUS`). The admin shows the recommended size (about 551×525) beside the preview and accepts other sizes.
8. **Image width and height are read from the file header** (png, jpg, webp) by a small helper, with no new dependency. `next/image` needs them.
9. **Services stay a fixed list of four** (`frontend/lib/services.ts`). The backend checks `service` and `category` against those four ids; a new service is a code change in both places.
10. **Stats are optional and are exactly four** (value and label) or none, as the frontend type says. Tags are free text.
11. **Order** is set by `sort_order` (admin can move a study up or down). New studies go last.
12. **Public endpoints need no key** (published content is public anyway), like the careers reads. Drafts return 404.
13. **No new dependency** is planned beyond what the recruitment work added.
14. **The detail page stays "Coming soon"** for now. Building real write-ups is a later, separate step; the data model leaves room for it.

## 3. Open questions

| # | Question | Default if not answered |
| --- | --- | --- |
| Q1 | If the backend is down, what should the website show? | Keep the last good response (cached); never an empty Home. No hard-coded copy once Phase 5 is done. |
| Q2 | Does `awtomatig-public` have a custom domain (for example `cdn.awtomatig.com`)? | Build against the `r2.dev` URL and flag it for launch. It is rate-limited and meant for development. |
| Q3 | Should the real detail page (full write-up) be part of this work? | No. Later. |

## 4. Architecture

```
Employee browser ─► admin (Next.js, /api rewrite) ─► backend  cms module (session cookie)
                                                        │   validates, writes row, uploads image
                                                        ├──► R2 public bucket  case-study/<slug>/image<N>.<ext>
                                                        └──► PostgreSQL schema `cms`

Website server (Next.js, revalidate 60) ──► backend  GET /api/v1/cms/public/case-studies  (no key)
Visitor browser ──► image URL on the public bucket (R2_PUBLIC_BASE_URL + key)
```

- Same shape as careers (S5, S6): the website reads server to server, the browser never calls the backend.
- Image bytes go to R2, never to Postgres. The database keeps only the key and metadata.
- This is the first `cms` module. It settles the "Payload vs custom" open item for case studies: **custom module** (new decision **B16**, to be added to `backend/ARCHITECTURE.md`).

## 5. Data model (backend, schema `cms`, migration `0004_cms_case_studies`)

`cms.case_studies`:

| Column | Notes |
| --- | --- |
| `id` | UUIDv7 |
| `slug` | unique, fixed at creation |
| `status` | `draft` or `published` (text + check, like `crm` and `recruitment`) |
| `sort_order` | integer |
| `published_at` | set when first published |
| `title`, `summary`, `client`, `description`, `challenge` | text |
| `seo_title`, `seo_description` | text, optional (the page falls back to title and summary) |
| `service`, `category` | text, check against the four service ids |
| `tags` | text array |
| `stats` | JSON, 0 or 4 entries of `{ value, label }`, checked by zod |
| `image_key`, `image_alt`, `image_width`, `image_height`, `image_size`, `image_type` | all null until an image is uploaded |
| `created_at`, `updated_at`, `created_by`, `updated_by` | as every business table |

Indexes: unique slug; `(status, sort_order)` for the public list.

## 6. API

Employee endpoints, under `/api/v1/cms/case-studies`. Permissions: `cms.case_study.read`, `.create`, `.update`, `.delete`. The seeded `admin` role holds `*`.

| Call | Permission | What |
| --- | --- | --- |
| `GET /` | read | Paged list (`page`, `pageSize` up to 100, `status`, `q` on title or client, `sort`, `order`). |
| `GET /:id` | read | One study with its image URL. |
| `POST /` | create | Creates a **draft**. |
| `PATCH /:id` | update | Edits any field except the slug. |
| `PUT /:id/image` | update | Uploads or replaces the image (multipart: one file `image` plus `alt`). Old file deleted after the new one is saved. |
| `POST /:id/publish` | update | Draft to published. 409 if not a draft; 400 if image or alt is missing. |
| `POST /:id/unpublish` | update | Published to draft. 409 if not published. |
| `PUT /order` | update | Sets the display order from a list of ids. |
| `DELETE /:id` | delete | Draft only (409 if published). Removes the row and every file under `case-study/<slug>/`. |

Public endpoints, under `/api/v1/cms/public/case-studies` (allow-listed shape, never the raw row: no status, audit columns or ids):

| Call | What |
| --- | --- |
| `GET /` | Published studies in order, each with `imageUrl`, width, height and alt. |
| `GET /:slug` | One published study. Draft or unknown returns 404. |

Rules worth building in:

- State changes lock the row (`select … for update`), as in recruitment.
- Upload order: save the new file first, then update the row, then delete the old file. If the row update fails, delete the new file again (best effort, logged).
- Audit entries (`cms.case_study.created` / `.updated` / `.image_replaced` / `.published` / `.unpublished` / `.deleted`) hold the study id and field names only.
- All input is validated with zod; list endpoints are paged.

## 7. Phases

Tick a box when it is done and verified.

### Phase 0: public storage (backend)

- [x] Confirm `awtomatig-public` allows public reads and note its base URL (Q2). Done by the owner 2026-11-04.
- [x] Add `R2_PUBLIC_BUCKET` and `R2_PUBLIC_BASE_URL` to `backend/.env` (owner), and make them required in `env.ts` (updated `env.spec.ts`, `test/setup-env.ts`, `.env.example`).
- [x] Add `putPublic`, `putPublicIfAbsent`, `deletePublic`, `listPublic` (by prefix) and `publicUrl(key)` to `shared/storage`, with unit tests on a stubbed client.
- [x] Extend `npm run storage:check` to upload, fetch by the public URL, and delete in the public bucket.

- [ ] Run `npm run storage:check` against the real buckets (needs the owner's go-ahead: it writes a tiny file and deletes it).

Done when: typecheck, lint, build and tests pass (**done 2026-11-04**), and `storage:check` passes against the real `awtomatig-public` bucket (**pending**).

### Phase 1: module and CRUD (backend)

- [x] Create `src/modules/cms/` (`api/ service/ domain/ repo/ schema.ts README.md`) and the Nest module.
- [x] Migration `0004_cms_case_studies`, checked by reading the SQL (`CREATE SCHEMA` is not always generated).
- [x] Domain: slug rules, service ids list, stats and tags rules, "can publish" and "can delete" rules as pure functions.
- [x] Repo, service and controller for list, get, create, patch, publish, unpublish, order, delete (without files yet).
- [x] Permissions and audit entries.
- [x] Unit tests for the domain; e2e tests on a throwaway PostgreSQL (access, validation, slug conflict, status rules, order, delete only a draft, audit holds no text).

Done when: lint (with the boundary check), typecheck, build and all tests pass. **Done 2026-11-04** (264 tests in 15 suites, throwaway PostgreSQL). Also regenerated `openapi.json`, added `src/modules/cms/README.md` and decision B16. Migration `0004` is not yet applied to the dev database.

### Phase 2: image and public API (backend)

- [x] Image validation by header bytes (png, jpg, webp), 5 MB cap, width and height reader.
- [x] `PUT /:id/image`: key allocator (`image1`, then the next unused number), conditional put, row update, old file deleted afterwards, rollback of the new file on failure.
- [x] Delete removes every object under `case-study/<slug>/`.
- [x] Publish requires image and alt.
- [x] Public list and by-slug endpoints with the allow-listed shape.
- [x] Regenerate `openapi.json`.
- [x] Tests: upload, replace (new number, old removed), wrong type, fake extension, too big, storage down stores nothing, failed row update removes the new file, delete removes files, public shape has no private fields, draft is 404.
- [x] Real-bucket check (a temporary script, deleted afterwards, as for recruitment): upload, read the public URL, replace, delete, confirm the prefix is empty.

Done when: tests pass and the real-bucket check passes. **Done 2026-11-04** (299 tests in 16 suites on a throwaway PostgreSQL; the real-bucket check passed against `awtomatig-public`). Extras built beyond the list: `PATCH` accepts `imageAlt` (edit the alt text without re-uploading); files are served with an immutable cache header (a file is never overwritten, so it can be cached for good); the upload never reuses a number, even a freed one, and skips leftovers from a failed cleanup.

### Phase 3: admin screens

- [x] Run `npm run api:generate` for the new types.
- [x] Navigation: a "Website" group with "Case Studies" (visible with `cms.case_study.read`).
- [x] List: table with title, client, service, status, order; row actions Edit, Publish / Unpublish, Delete; filter by status; search; move up / down.
- [x] Form (new and edit): title, summary, client, service and category (select from the four), challenge, description, tags input, four stat rows (all or none), SEO fields, and the image panel (upload, preview, alt text, recommended size, replace).
- [x] Confirm dialogs (existing `Dialog`) for Publish, Unpublish and Delete; Delete is offered on drafts only and names the study.
- [x] Clear errors: missing image or alt on publish, slug taken, upload too big or wrong type.
- [x] Update `admin/DESIGN.md` if a new pattern is added.

Done when (typecheck, lint and build pass **2026-11-04**; the browser run of create, upload, edit, replace image, publish, unpublish, reorder and delete **passed 2026-11-04**): typecheck, lint and build pass, and the whole flow (create, upload, edit, publish, unpublish, delete) is driven in headless Chrome against the running dev servers, with test data removed afterwards.

### Phase 4: website reads from the CMS (frontend)

- [x] `lib/caseStudies.ts`: server-side fetchers (`revalidate: 60`) with the type `CaseStudy` where `image` is `{ src, width, height, alt }`; keep the last good response on failure (Q1).
- [x] `images.remotePatterns` in `next.config.ts` and `ASSETS_URL` is the one allowed host (the CSP `img-src` did not need it: `next/image` loads the file on the server).
- [x] Home "Selected work", the Case Studies page (`CaseStudyFilter` takes the studies as props from the server page) and the campaign "Relevant work" (filtered by slug) all use the fetcher.
- [x] `generateStaticParams` and `generateMetadata` for `/case-studies/[slug]` use it (unknown slug: 404; revalidate 60).
- [x] `sitemap.ts` lists published studies.
- [x] Empty states: no published studies, backend down with nothing cached.
- [x] Update `frontend/DESIGN.md` (the `caseStudies.ts` description) and `frontend/RULES.md` if needed.

Done when: `tsc`, lint and build pass, and the three pages plus a detail page render from live data against the local backend, including after unpublishing a study. **Done 2026-11-04** (checked from the HTML of a production server, not yet in a browser at 1440 / 1024 / 390).

### Phase 5: seed and release

- [x] (dev database done 2026-11-04; for the VPS run `npm run seed:case-studies` in `backend/` after the deploy: it inserts the rows from `backend/seed/case-studies.sql`, the images are already in the bucket) One-off seed script loads the three existing studies (Royal Safari Tours, Power Bank Bangladesh, New York Clean Team) from `caseStudies.ts` and uploads their images from `frontend/public/images/Case Study/` to `case-study/<slug>/image1.png`. Needs the owner's go-ahead because it writes to the real bucket.
- [ ] Compare Home and the Case Studies page before and after: same text, same order, same images.
- [ ] Remove the hard-coded list and the `public/images/Case Study/` imports from the frontend.
- [ ] VPS checklist (section 9) done and one real publish verified.

## 8. Verification (every phase)

- Backend: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` against a throwaway PostgreSQL; `openapi.json` current.
- Admin: `npm run typecheck`, `npm run lint`, `npm run build`, plus a browser run of the flow.
- Frontend: `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus a browser look at 1440, 1024 and 390.
- Report what was and was not checked, as in the other changes.

## 9. VPS release checklist

- [ ] `R2_PUBLIC_BUCKET` and `R2_PUBLIC_BASE_URL` in the VPS `backend/.env` before the merge (a missing required variable stops the API at boot).
- [ ] The migration runs through `deploy.sh`; check `\dt cms.*` afterwards.
- [ ] The public bucket's public access or custom domain is set (Q2); if `r2.dev` is used, note it as a launch item.
- [ ] `WEBSITE_URL=http://127.0.0.1:3010` in the VPS `backend/.env` (instant refresh of the website after a publish; without it the site catches up within a minute).
- [ ] `images.remotePatterns` host matches the real public URL. The admin **and the website** need `ASSETS_URL` (same value as `R2_PUBLIC_BASE_URL`) in their VPS `.env` before their next build. The backend must be up, migrated and seeded when the website builds.
- [ ] `npm run seed:case-studies` run once in `backend/` on the VPS; Home and Case Studies checked on the live site. It assumes the VPS uses the same R2 public bucket as dev (the image keys are in the SQL).
- [ ] Publish, unpublish and delete tried once on a test study, then the test study removed.

## 10. Docs to update

| Where | What |
| --- | --- |
| `backend/ARCHITECTURE.md` | Decision **B16** (custom `cms` module; public bucket storage), open item about Payload resolved for case studies. |
| `backend/src/modules/cms/README.md` | Tables, endpoints, rules, permissions, privacy notes. |
| `backend/MEMORY.md`, `admin/MEMORY.md`, `frontend/MEMORY.md` | Status rows, decisions, gotchas and a dated change log per phase, with what was verified. |
| Root `MEMORY.md` | One status update and one change-log line per phase, naming the folder. |
| Root `ARCHITECTURE.md` | A decision row (S7) once the website reads the CMS. |
| `admin/DESIGN.md`, `frontend/DESIGN.md` | Any new pattern or changed data file. |

## 11. Progress

| Phase | Status | Date |
| --- | --- | --- |
| 0 Public storage (backend) | code done and tested; real-bucket check pending | 2026-11-04 |
| 1 Module and CRUD (backend) | done and tested | 2026-11-04 |
| 2 Image and public API (backend) | done, tested and checked against the real bucket | 2026-11-04 |
| 3 Admin screens | done: typecheck, lint, build pass and the whole flow driven in headless Chrome | 2026-11-04 |
| 4 Website reads from the CMS (frontend) | done and tested against the local backend (unpublish and republish checked, backend-down checked); browser look at 3 widths pending | 2026-11-04 |
| 5 Seed and release | not started | |
