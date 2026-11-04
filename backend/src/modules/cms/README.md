# CMS module

The website's managed content. First piece: **case studies**, which employees create in the admin app and the public site shows on Home and the Case Studies page. Plan and phases: [../../../../CASE_STUDY_PLAN.md](../../../../CASE_STUDY_PLAN.md). Postgres schema: `cms`. Each case study has one showcase image in the **public** R2 bucket (`awtomatig-public`), kept as a key plus metadata; the bytes are never in Postgres. The module sends no email.

**Built so far (Phases 1 and 2):** the data, the employee endpoints, the showcase image (upload, replace, cleanup), publish / unpublish, ordering, delete, and the public endpoints the website reads.

## Layout

```
api/       case-studies.controller.ts    CaseStudiesController (employees) and PublicCaseStudiesController (the website)
           case-studies.dto.ts           zod DTOs
           image-form.ts                 reads the multipart upload (HTTP only)
service/   case-studies.service.ts       use cases: create, list, get, update, publish, unpublish, order, set image, delete, public reads
domain/    case-study.ts                 service ids, statuses, zod schemas, slug, image folder, publish rule (no framework, no database)
           image.ts                      detects PNG / JPEG / WebP and their size from the file bytes, builds image keys (no image library)
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

## Not here yet

A cleanup job for orphan files (a failed delete leaves one, which is logged), more than one image per study, a detail page write-up, previews of drafts, and a version history are later.
