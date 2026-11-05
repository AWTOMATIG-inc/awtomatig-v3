# CMS module

The website's managed content. First piece: **case studies**, which employees create in the admin app and the public site shows on Home and the Case Studies page. Plan and phases: [../../../../CASE_STUDY_PLAN.md](../../../../CASE_STUDY_PLAN.md). Postgres schema: `cms`. Each case study has one showcase image in the **public** R2 bucket (`awtomatig-public`), kept as a key plus metadata; the bytes are never in Postgres. The module sends no email.

**Built so far (Phases 1 and 2):** the data, the employee endpoints, the showcase image (upload, replace, cleanup), publish / unpublish, ordering, delete, and the public endpoints the website reads.

## Layout

```
api/       case-studies.controller.ts    CaseStudiesController (employees) and PublicCaseStudiesController (the website)
           case-studies.dto.ts           zod DTOs
           image-form.ts                 reads the multipart upload (HTTP only)
service/   case-studies.service.ts       use cases: create, list, get, update, publish, unpublish, order, set image, delete, public reads
           public-image-store.ts         checks an uploaded image and stores it under the next unused number in the public bucket (shared by every cms content type with images)
           website-revalidator.ts        tells the website to drop its cached case studies (no tag) or testimonials (`?tag=testimonials`)
domain/    case-study.ts                 service ids, statuses, zod schemas, slug, image folder, publish rule (no framework, no database)
           image.ts                      detects PNG / JPEG / WebP and their size from the file bytes, builds image and file keys (no image library)
repo/      case-studies.repo.ts          the only code that touches the table
schema.ts                                cms.case_studies
```

## Employee endpoints (all need a session)

Under `/api/v1/cms/case-studies`:

| Method and path | Permission | What |
| --- | --- | --- |
| `GET /` | `cms.case_study.read` | Paged list (`page`, `pageSize` up to 100, `status`, `q` on title or client, `sort` by `sortOrder` / `createdAt` / `title`, `order`). Default: display order. |
| `POST /` | `cms.case_study.create` | Creates a **draft** in the last position. The slug is the title as a slug unless `slug` is sent. 409 when the slug is taken. |
| `GET /:id` | `cms.case_study.read` | One study with its image (`url`, `alt`, `width`, `height`) or `null`. |
| `PATCH /:id` | `cms.case_study.update` | Changes any field except the slug. `imageAlt` edits the image's alt text on its own (400 if no image yet). |
| `PUT /:id/image` | `cms.case_study.update` | Uploads or replaces the showcase image. `multipart/form-data` with an `alt` field (1 to 200 characters) and one `image` file: PNG, JPEG or WebP, 5 MB at most. Returns the study. |
| `POST /:id/publish` | `cms.case_study.update` | Draft to published. 409 if not a draft; 400 without an image and its alt text. |
| `POST /:id/unpublish` | `cms.case_study.update` | Published to draft. 409 if not published. |
| `PUT /order` | `cms.case_study.update` | Sets the display order from `{ ids }`, which must hold **every** case study exactly once (400 otherwise, so a partial list cannot reshuffle the rest). Returns the list. |
| `DELETE /:id` | `cms.case_study.delete` | Deletes a **draft** for good, with every file in its image folder (409 if published: unpublish first). 204. |

## Public endpoints (for the website's server)

Under `/api/v1/cms/public/case-studies`. No key: published content is public anyway. They return an allow-listed shape, never the raw row: no id, status or audit columns, and the image as a full public URL, never a bucket key.

| Method and path | What |
| --- | --- |
| `GET /` | Published studies in display order, at most 100: `slug`, `title`, `summary`, `client`, `service`, `category`, `description`, `challenge`, `tags`, `stats`, `seoTitle`, `seoDescription`, `publishedAt`, `image { url, alt, width, height }`. |
| `GET /:slug` | One published study in the same shape. A draft, an unpublished study or an unknown slug returns 404; a malformed slug returns 400. |

An edit, a replaced image or an unpublish shows in these responses at once; the website's own 60-second refresh is what makes it appear on the site within about a minute.

## Rules worth knowing

- **Slug** is fixed at creation. It is the page address (`/case-studies/<slug>`) and the image folder (`case-study/<slug>/`), so changing a title never moves files or breaks a link. A taken slug is refused, never silently changed, because the address is meant to be readable. Lowercase letters, digits and single dashes, at most 60 characters.
- **Services** are the website's four ids (`website-infrastructure`, `back-office-operations`, `erp-business-systems`, `ad-tech`), checked in zod and by database constraints. `service` is the "Service:" row, `category` is the filter tab. A new service is a code change here and in `frontend/lib/services.ts`.
- **Results (`stats`)** are exactly four `{ value, label }` entries or none; **tags** at most 8.
- **A published study always has a complete image**: enforced by the service (clear message) and by a database check (`case_studies_published_image_check`).
- **Unpublish keeps `publishedAt`**: publishing again keeps the first date.
- **State changes lock the row** (`select ... for update`), so two employees cannot publish, unpublish or delete the same study at once. Reordering locks every row.
- **The API returns the image's public URL** (`R2_PUBLIC_BASE_URL` + key), never the bucket key on its own.
- **Image keys** are `case-study/<slug>/image<N>.<ext>` in the public bucket `awtomatig-public`. The type is found from the file's own first bytes (the file name and the type the client sent are ignored) and the extension follows it. Width and height are read from the file header (at most 8000 each).
- **A file is never overwritten, and a number is never reused.** An upload takes one more than the highest number in the folder (leftovers from a failed cleanup count), stored with R2's conditional put, so a CDN or browser can never show an old picture at an address that now holds a new one. For the same reason files are served with `Cache-Control: public, max-age=31536000, immutable`.
- **Upload order:** list the folder, store the new file, update the row (one transaction, with the audit entry), then delete the old file. If the row update fails the new file is deleted again; if the old file cannot be deleted the upload still succeeds and the leftover is logged by study id. Two uploads at once end with one file, the one the row points at.
- **Delete order:** the row goes first, then the whole image folder. If the folder cannot be deleted the study is still gone and the folder is an orphan, logged by study id.
- **Draft-only delete** keeps anything live from vanishing by accident.

## Permissions

`cms.case_study.read`, `.create`, `.update`, `.delete`. The seeded `admin` role holds `*`.

## Data and privacy

Case study text and images are public once published, and hold no personal data. Audit entries (`cms.case_study.created` / `.updated` / `.image_replaced` / `.published` / `.unpublished` / `.reordered` / `.deleted`) carry the study id and changed field names (for an image: the type and size) only, never the text, the alt text, the file name or the key.

## Testimonials

The client quotes in the website's "Client testimonials" section (Home, About). Plan and phases: [../../../../TESTIMONIALS_PLAN.md](../../../../TESTIMONIALS_PLAN.md). Table `cms.testimonials` (migration `0005_cms_testimonials`). A testimonial has no page, so it has no slug.

**Built (Phases 1 and 2):** the data, the employee endpoints, the company logo (upload, replace, removal, folder cleanup on delete) and the public endpoint the website reads. The admin screens (Phase 3) and the website (Phase 4) are not built yet.

Files: `api/testimonials.controller.ts` and `.dto.ts`, `api/image-form.ts` (the multipart reader, shared with case studies), `service/testimonials.service.ts`, `service/public-image-store.ts` (the image checks and numbered storage shared with case studies), `domain/testimonial.ts`, `repo/testimonials.repo.ts`, and the `testimonials` table in `schema.ts`.

### Employee endpoints (all need a session)

Under `/api/v1/cms/testimonials`:

| Method and path | Permission | What |
| --- | --- | --- |
| `GET /` | `cms.testimonial.read` | Paged list (`page`, `pageSize` up to 100, `status`, `q` on name, company or quote, `sort` by `sortOrder` / `createdAt` / `name` / `company`, `order`). Default: display order. Same shape as one testimonial. |
| `POST /` | `cms.testimonial.create` | Creates a **draft** in the last position. `quote` (1 to 600 characters), `name`, `role`, `company` (1 to 120 each), `service` (one of the four ids); `consentConfirmed` and `logoInBlack` default to false. |
| `GET /:id` | `cms.testimonial.read` | One testimonial with its logo (`url`, `width`, `height`) or `null`. |
| `PATCH /:id` | `cms.testimonial.update` | Changes any of those fields. 409 if it would withdraw `consentConfirmed` from a published testimonial. |
| `PUT /:id/logo` | `cms.testimonial.update` | Uploads or replaces the logo. `multipart/form-data` with one file in the field `logo` (no other field: the alt text is the company name). PNG, JPEG or WebP, 5 MB, found from the file's bytes (name and client type ignored, no SVG). Works on a draft and on a published testimonial. |
| `DELETE /:id/logo` | `cms.testimonial.update` | Removes the logo and its file. Allowed while published: the card then shows the company name. Removing a logo that is not there is a 200 that changes nothing. |
| `POST /:id/publish` | `cms.testimonial.update` | Draft to published. 409 if not a draft; 400 without `consentConfirmed`. No logo is needed. |
| `POST /:id/unpublish` | `cms.testimonial.update` | Published to draft. 409 if not published. |
| `PUT /order` | `cms.testimonial.update` | Sets the display order from `{ ids }`, which must hold **every** testimonial exactly once (400 otherwise). Returns the list. |
| `DELETE /:id` | `cms.testimonial.delete` | Deletes a **draft** for good (409 if published: unpublish first), then every file in `testimonial/<id>/`. 204. |

### Public endpoint (for the website's server, no key)

`GET /api/v1/cms/public/testimonials`: the published testimonials in display order, **at most 50**, each `{ quote, name, role, company, service, logoInBlack, logo: { url, width, height } | null }`. An allow-list: no id, status, consent flag, audit columns or bucket key. Drafts and unpublished testimonials never appear.

### Logo files

- **Where:** the public bucket, `testimonial/<id>/logo<N>.<ext>`, named by the row id (which never changes), served from `R2_PUBLIC_BASE_URL` with `Cache-Control: public, max-age=31536000, immutable`.
- **Never overwritten.** `N` is one more than the highest number in the folder, stored with R2's conditional put, so a freed number never comes back and a CDN cannot serve an old picture at a new address.
- **Order:** store the new file, update the row (and audit) in one transaction, then delete the old file. If the row update fails the new file is deleted again; if the old file cannot be deleted the upload still succeeds and the orphan is logged by testimonial id (never by key). The same order is used by case study images, through `PublicImageStore`.
- **Delete** removes the row first, then the whole folder; if the folder cannot be deleted the testimonial is still gone and the orphan folder is logged.
- **Recommended:** a transparent PNG at least 320 px wide (the card draws it 36 px tall, at most 160 px wide).

### Rules worth knowing

- **Consent.** Name, role and company are a real person's details on a public page, so a testimonial can only be published once `consentConfirmed` is true ("the client agreed to this quote being published with their name and company"). It is enforced by the service (clear message) and by a database check (`testimonials_published_consent_check`). Consent cannot be withdrawn from a live testimonial: unpublish it first. For a "remove me" request: unpublish, then delete.
- **Services** are the website's four ids, checked in zod and by a database check, as for case studies.
- **State changes lock the row** (`select ... for update`), so two employees cannot publish, unpublish or delete the same testimonial at once. Reordering locks every row.
- **The logo is optional**, and its five columns are all set or all empty (`testimonials_logo_check`). `logoInBlack` draws a white or very light logo in black on the white card.
- **Unpublish keeps `publishedAt`**: publishing again keeps the first date.
- **The website is told to refresh** (`WebsiteRevalidator.testimonialsChanged()`, `POST /api/revalidate?tag=testimonials`) after a publish, an unpublish, a reorder, and an edit, logo upload or logo removal of a *published* testimonial. A draft edit, a create and a delete (drafts only) do not call it. It is best effort and never fails the request.

### Permissions

`cms.testimonial.read`, `.create`, `.update`, `.delete`, separate from the case study ones. The seeded `admin` role holds `*`.

### Data and privacy

The quote, name, role and company are personal data once a client is named. Audit entries (`cms.testimonial.created` / `.updated` / `.published` / `.unpublished` / `.reordered` / `.deleted` / `.logo_replaced` / `.logo_removed`) carry the testimonial id and changed field names (for a logo: the file type and size) only, never the text, file name or key.

### Seed (the website's six first testimonials)

`npm run seed:testimonials` loads `seed/testimonials.sql` (six published testimonials with fixed ids, their logos already in the public bucket as `testimonial/<id>/logo1.png`). Safe to repeat: a row whose id exists is left alone. Run it once after the deploy that applies migration `0005`. It assumes the same public bucket as the dev environment.

## Not here yet

A cleanup job for orphan files (a failed delete leaves one, which is logged), more than one image per study, a detail page write-up, previews of drafts, and a version history are later.

## Site metrics

The website's trust numbers (years of experience, businesses supported, retention, systems delivered, projects completed, client systems supported, and the Google / Clutch / Fiverr ratings). Plan: [../../../../SITE_METRICS_PLAN.md](../../../../SITE_METRICS_PLAN.md). Table `cms.site_metrics` (migration `0006_cms_site_metrics`), decision B18.

- **A fixed set of nine slots.** The catalog in `domain/site-metric.ts` lists each key, its field title, its kind (`stat` or `rating`), its default value and every page and section that shows it. Adding a slot, or showing a figure in a new place, means editing the catalog and the website in the same change.
- **A slot with no row shows its default**, so the website works before the seed is run. `npm run seed:site-metrics` loads `seed/site-metrics.sql` (never overwrites an edit).
- **Formats.** A stat is whole digits plus an optional `+`, `%`, `k` or `M` (up to 5 digits); a rating is 0 to 5 with at most one decimal. The website's count-up cannot animate anything else.
- **Endpoints:** `GET /api/v1/cms/site-metrics` (`cms.metric.read`; each item has `title`, `kind`, `hint`, `placements`, `value`, `defaultValue`, `updatedAt`), `PATCH /api/v1/cms/site-metrics/:key` (`cms.metric.update`, body `{ value }`; live at once, no draft; the website refresh and the audit entry happen only when the value changed), and the public `GET /api/v1/cms/public/site-metrics` returning `{ values: { key: value } }`.
- **Audit:** `cms.site_metric.updated` with `key`, `from` and `to`.
