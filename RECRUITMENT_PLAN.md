# Recruitment system: implementation plan

Status: **built (Phases 0 to 5 done 2026-11-02); the VPS release in section 9 is the only thing left.** Written 2026-11-02. It spans all three folders, so it lives at the root. When a phase ships, record it in each folder's `MEMORY.md` and add one line to the root `MEMORY.md`, then tick the phase here.

What it does: employees create job openings in the admin app. The public website lists open jobs and lets candidates apply with a form and a PDF resume. Employees review applications per opening in the admin app. The candidate gets a confirmation email.

Folder docs to read before each phase: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), [backend/RULES.md](backend/RULES.md), [admin/DESIGN.md](admin/DESIGN.md), [frontend/DESIGN.md](frontend/DESIGN.md).

---

## 1. Decisions already made (from the owner)

| Topic | Decision |
| --- | --- |
| Storage | Cloudflare R2, **private** bucket `awtomatig-private`. Credentials are already in `backend/.env`. |
| Resume | **PDF only**, 5 MB max. |
| Currency | BDT only. |
| Screening questions | Free-text questions with free-text answers. No multiple choice. Any number per job. |
| Duplicates | One application per email and one per phone number (checked on the server, see section 4.5). |
| Email | A confirmation email to the candidate after applying. Clean, modern, in the current design system. |
| Education | Degree name, field of study, institution, completion date or "ongoing", grade (optional). As many rows as needed. |
| Experience | Company, title, from, to (or "current"), responsibilities. As many rows as needed. Optional. |
| Social links | GitHub and LinkedIn, both optional. |
| Spam and retention | No CAPTCHA and no auto-delete for now (added later). |
| Access | One admin account for now. Role-based permissions come later, but the permission names are defined now so nothing is rewritten. |
| Design | No Figma. Follow the existing design system in each app. |

## 2. Assumptions I made: tell me if any is wrong

1. **"Apply only once" means once per job opening**, not once ever. Someone can apply to two different jobs. Otherwise a candidate rejected for one role could never apply for another. **Confirmed by the owner (2026-11-02).**
2. **Resumes are stored under the job title with the candidate's own file name** (changed 2026-11-02 at the owner's request; first planned as ids only, see backend B15). Key: `career/<job title>/<file name>.pdf` in the private bucket, made safe first, and never replacing a file: a name that is taken gets a short application id added. The key is saved with the application, so renaming a job later is harmless. (Originally: `career/<jobId>/<applicationId>.pdf`.) R2 has no real folders, so the "folder" appears automatically with the first upload and nothing has to be created. Titles can change or repeat, ids cannot.
3. **Education has no start date**, only a completion date (or ongoing), matching your example (Bachelor of Science, CSE, AUST, Nov 20, 2025). At least one education row is required. **Confirmed (2026-11-02).**
4. **Salary** is optional. Both fields filled = range, only the first = fixed amount, empty = shown as "Negotiable".
5. **Job text fields are plain text, not rich text.** Description keeps paragraphs, Requirements and Benefits show one bullet per line. This avoids an editor dependency and HTML injection risks. **Confirmed (2026-11-02).**
6. **Deadline is a date, valid through the end of that day in Dhaka time (UTC+6).** A job accepts applications while it is `open` and the deadline has not passed, so no scheduled job is needed to close it.
7. **Consent checkbox** (agree to the Privacy Policy) on the application form, like the contact form. It is stored as a timestamp. **Confirmed (2026-11-02).**
8. **Application statuses:** `new`, `shortlisted`, `interview`, `hired`, `rejected`, plus a private notes field.
9. **No email to the team** on a new application. They see it in the admin. Easy to add later (the website already sends the contact email). **Confirmed (2026-11-02): only the candidate is emailed.**
10. **No new dependency beyond the three below.** PDF-only means `sharp` and `file-type` are not needed now (a PDF is checked by its `%PDF-` header).

## 3. Architecture

```
Candidate browser
   │  form + PDF
   ▼
frontend (Next.js Server Action)  ── checks, rate limit, honeypot
   │  server to server, header x-ingest-key (existing LEAD_INGEST_KEY), multipart
   ▼
backend  recruitment module ── validates, dedupes ──► R2 private bucket  career/<job title>/<file name>.pdf
   │                                                 
   └────────────────────────────────────────────────► PostgreSQL schema `recruitment`

Employee browser ─► admin (Next.js, /api rewrite) ─► backend (session cookie) ─► signed R2 link for the resume (5 min)
```

- Same pattern as contact inquiries (root decision S5, backend B11): the browser never calls the backend or R2.
- The backend sends **no** email. The website sends the confirmation with the existing Gmail setup.
- The shared key is the existing `LEAD_INGEST_KEY`. I move its guard from `crm/` into `shared/auth/` so both modules use it. The name is historical. No new secret to generate or deploy.
- The recruitment module follows the layout in backend ARCHITECTURE section 2: `api/`, `service/`, `domain/`, `repo/`, `schema.ts`, `README.md`. File storage lives in `shared/storage/` (it is cross-cutting).

### 3.1 New dependencies (approved)

| Package | Folder | Why |
| --- | --- | --- |
| `@aws-sdk/client-s3` | backend | R2 speaks the S3 API: put, delete, head |
| `@aws-sdk/s3-request-presigner` | backend | Short-lived signed link to view a resume |
| `@fastify/multipart` | backend | Reads the PDF upload from the website's server |

Nothing new in `frontend/` (nodemailer already exists) or `admin/`.

### 3.2 R2 gotchas to handle in the storage service

- Endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, region `"auto"`.
- Recent AWS SDK versions add checksum headers that R2 can reject or that break presigned links. Set `requestChecksumCalculation` and `responseChecksumValidation` to `"WHEN_REQUIRED"`.
- Never expose `R2_*` values to `NEXT_PUBLIC_*`, the admin or the website. Only the backend holds them.

## 4. Data model (Postgres schema `recruitment`)

Conventions from backend ARCHITECTURE section 1: UUIDv7 keys, `timestamptz`, `created_at` / `updated_at`, money as `numeric(19,4)` with the currency next to it, `created_by` on business tables.

### 4.1 `jobs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `slug` | text, unique | From the title plus a short id (`senior-designer-7f3a`). Never changes after creation, so shared links keep working. |
| `title` | text | Position name |
| `job_type` | enum | `full_time`, `part_time`, `contractual` |
| `work_mode` | enum | `onsite`, `remote`, `hybrid` |
| `salary_min`, `salary_max` | numeric(19,4), null | `salary_currency` is always `BDT`. Check: `max >= min`; max only if min is set. |
| `vacancies` | int, ≥ 1 | |
| `office_timing` | text | Free text, e.g. "Mon - Fri, 11 AM to 6 PM" |
| `location` | text | |
| `description`, `requirements`, `benefits` | text | Plain text (assumption 5) |
| `deadline_on` | date | Assumption 6 |
| `status` | enum | `draft`, `open`, `closed` |
| `published_at`, `closed_at` | timestamptz, null | |
| audit columns | | |

"Accepting applications" is derived: `status = 'open'` and `deadline_on >= today in Asia/Dhaka`. One pure function in `domain/` is the only place that rule lives.

### 4.2 `job_questions` (screening questions)

`id`, `job_id`, `position` (order), `text` (max 500), `required` (bool), `archived_at`.
A question that already has answers is **archived, never deleted**, so old applications still make sense.

### 4.3 `applications`

| Column | Notes |
| --- | --- |
| `id`, `job_id`, `submission_id` | `submission_id` makes a retry idempotent (same pattern as leads) |
| `full_name`, `email`, `phone` | As typed |
| `email_normalized`, `phone_normalized` | Lowercased email; phone as digits with Bangladesh numbers normalised so `01712345678` and `+8801712345678` are the same |
| `github_url`, `linkedin_url` | Optional, must be `https://` URLs on the right host |
| `resume_key`, `resume_name`, `resume_size` | The R2 object key and the original file name (display only) |
| `status`, `notes` | Assumption 8 |
| `consented_at` | |
| audit columns | |

**Unique indexes:** `(job_id, email_normalized)` and `(job_id, phone_normalized)`. The database is the final guard against a race, whatever the code checks first.

### 4.4 Child tables

- `application_educations`: `application_id`, `position`, `degree`, `field_of_study`, `institution`, `completed_on` (date, null), `ongoing` (bool), `grade` (null). Check: either `completed_on` or `ongoing`.
- `application_experiences`: `application_id`, `position`, `company`, `title`, `from_on` (date), `to_on` (date, null), `current` (bool), `responsibilities` (text). Check: `to_on` or `current`, and `to_on >= from_on`.
- `application_answers`: `application_id`, `question_id`, `question_text` (a **copy** of the question as it was when answered), `answer` (text).

Limits (enforced by zod on the server, repeated in the forms): 10 education rows, 15 experience rows, 20 questions per job, answers up to 2,000 characters, responsibilities up to 2,000, names and titles up to 200.

### 4.5 Duplicate rule

Before uploading anything, the service looks for an application on the same job with the same normalised email **or** phone, and answers `409 ALREADY_APPLIED` ("You have already applied for this position"). The unique indexes catch a simultaneous double submit. The website shows the same message.

## 5. Backend API (`/api/v1/recruitment`)

Permissions (added to the seeded `admin` role by its `*`): `recruitment.job.read`, `recruitment.job.create`, `recruitment.job.update`, `recruitment.application.read`, `recruitment.application.update`.

**Employee endpoints (session cookie):**

| Method and path | Permission | What |
| --- | --- | --- |
| `GET /jobs` | job.read | Paged list with status filter, application count and "new" count per job |
| `POST /jobs` | job.create | Creates a job (as `draft` or published) with its questions |
| `GET /jobs/:id` | job.read | One job with its questions |
| `PATCH /jobs/:id` | job.update | Edit fields and questions (add, reorder, edit, archive) |
| `POST /jobs/:id/close`, `POST /jobs/:id/reopen` | job.update | Close or reopen (reopen needs a deadline in the future) |
| `GET /jobs/:id/applications` | application.read | Paged list: name, email, phone, status, applied date. No answers in the list. |
| `GET /applications/:id` | application.read | Full detail: education, experience, links, answers |
| `PATCH /applications/:id` | application.update | Status and notes |
| `GET /applications/:id/resume` | application.read | `{ url, expiresAt }`, a signed R2 link valid for 5 minutes. Recorded in the audit log. |

**Website endpoints:**

| Method and path | Who | What |
| --- | --- | --- |
| `GET /public/jobs` | Anyone (rate limited) | Open jobs, soonest deadline first. Draft jobs and internal fields never leave. |
| `GET /public/jobs/:slug` | Anyone | One job with its questions and `acceptingApplications`. `closed` jobs return 200 with the flag false, so the page can say so. `draft` returns 404. |
| `POST /public/jobs/:slug/applications` | `x-ingest-key` only | `multipart/form-data`: a JSON `payload` field plus the `resume` file. Idempotent by `submissionId`. |

**Application submission steps (service):**

1. Parse and validate the payload with zod; the job must exist and be accepting applications.
2. Every required question has a non-empty answer; answers only for the job's active questions.
3. Resume: exactly one file, ≤ 5 MB (multipart limit, so it is never fully buffered past that), name ends `.pdf`, MIME `application/pdf`, content starts with `%PDF-`.
4. Duplicate check (4.5).
5. Upload to `career/<job title>/<file name>.pdf` with `Content-Type: application/pdf`, as a conditional put that never overwrites (a taken name gets a short application id added).
6. Insert the application and its child rows in **one transaction**. If it fails, delete the uploaded object (best effort) and return the error.
7. Write `recruitment.application.submitted` to the audit log with ids only.

Privacy rules: no name, email, phone, answers or resume text in logs or the audit log (ids and changed field names only), as in the CRM module.

## 6. Admin screens (`admin/`)

Follows [admin/DESIGN.md](admin/DESIGN.md) and the existing primitives (`PageHeader`, `DataTable`, `StatusBadge`, `Card`, `Field`, `Button`, `EmptyState`, `SegmentedLinks`). No new dependency.

| Route | Screen |
| --- | --- |
| `/recruitment/jobs` | Job Openings list: title, type, mode, vacancies, deadline, status badge (Draft / Open / Closed / Expired), applicant count with a "new" count. Status filter. "New opening" button. Empty state. |
| `/recruitment/jobs/new` | The opening form (below) |
| `/recruitment/jobs/[id]` | Two tabs (`SegmentedLinks`): **Applications** (table, status filter, search by name or email) and **Details** (edit form, Close / Reopen button) |
| `/recruitment/jobs/[id]/applications/[applicationId]` | Applicant: contact and links, education, experience, screening answers, resume button (opens the signed link in a new tab), status select, notes |

Opening form sections: Basics (title, type, work mode, vacancies, location, office timing), Salary (BDT, "from" and optional "to"), Content (description, requirements, benefits), Deadline (date input), **Screening questions** (a repeatable list: add, remove, move up or down, "required" toggle; no drag-and-drop library). Buttons: Save draft, Publish.

Sidebar: a new **Recruitment** group with **Job Openings** (`Briefcase` icon from `lucide-react`). Dashboard: two small cards later in Phase 5 (open jobs, new applications).

API types: run `npm run openapi:export` in `backend/`, then `npm run api:generate` in `admin/`. No hand-written types.

## 7. Website pages (`frontend/`)

Follows [frontend/DESIGN.md](frontend/DESIGN.md): semantic tokens, `type-*` utilities, the site container, existing `components/ui` buttons. No raw hex or px. If something has no token I flag it to you instead of inlining it.

| Route | Content |
| --- | --- |
| `/careers` | Hero (title, short intro), then a list of open jobs as cards: title, type, work mode, location, salary (or "Negotiable"), deadline, "View and apply". When none: a calm "Currently no vacancies" state. When the backend cannot be reached: a different message ("We could not load openings, please try again"), so a failure is never shown as "no vacancies". |
| `/careers/[slug]` | Job details (summary strip, description, requirements, benefits, office timing), then the application form. Closed or expired job: the details plus "This position is no longer accepting applications" and a link back. Unknown or draft: the standard 404. |

Application form sections, in order: **Personal** (name, email, phone), **Education** (repeatable), **Experience** (repeatable, optional), **Links** (GitHub, LinkedIn, optional), **Screening questions** (one textarea per question, required ones marked), **Resume** (PDF, shows name and size, rejects other types and files over 5 MB before sending), consent checkbox, Submit. Inline field errors, a sending state, a success panel that tells the candidate to check their email, and the same honeypot and per-IP limit the contact form uses.

Data: server-side `fetch` to the backend with `revalidate: 60` (a new opening can take up to a minute to show; a closed one stops accepting at once because the backend decides). Navigation: add **Careers** to `SITE.nav`; footer picks it up automatically.

### 7.1 Confirmation email

- A pure function `renderApplicationConfirmation(data) → { subject, html, text }` in `frontend/`, sent through the existing nodemailer and Gmail setup, `Reply-To` the first `CONTACT_TO` address (same as D60). Both an HTML and a plain-text version.
- Layout: single column, 600 px wide, table-based with inline CSS (the only thing every mail client handles). Brand wordmark on a charcoal header with a thin cyan rule; white body; a summary card with Position, Job type, Work mode, Applied on and a short reference; a "What happens next" list of three steps; a footer with `info@awtomatig.com`, the site link and a "please do not reply with your documents" line. Text on cyan is black. Cyan is used once.
- Email clients cannot read CSS variables, so the **token hex values are copied into the template file with a comment naming each token**. This is the one deliberate exception to "no raw hex" and will be flagged in the file and in `frontend/DESIGN.md`. Fonts fall back to Arial / Helvetica (web fonts are unreliable in mail).
- All user-supplied text is HTML-escaped. Sending failure never loses the application: the application is already stored, so a failed email is logged and the candidate still sees success.
- I check it by rendering the HTML in headless Chrome at desktop and phone width. **Only you can check Gmail, Outlook and Apple Mail**: I will ask you to send one real test.

## 8. Phases

Work one phase at a time. Each ends with a stop where you can look at it before the next starts. Every phase also updates the docs and memory files in the same change.

### Phase 0: Foundation (backend) — done 2026-11-02 (`storage:check` passed against real R2)
1. Install the three packages (3.1).
2. `env.ts` and `.env.example`: add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET` (required) and `R2_PUBLIC_BUCKET`, `R2_PUBLIC_BASE_URL` (optional, unused here). Remove the unused `R2_API_TOKEN` line from `.env`. Update `env.spec.ts` and `test/setup-env.ts`.
3. `shared/storage/`: `StorageService` (put, delete, head, signed GET URL), module, typed errors. Unit test with a stubbed S3 client.
4. Register `@fastify/multipart` in `bootstrap.ts` with a 5 MB file limit and one file.
5. Move the ingest-key guard to `shared/auth/` and point `crm` at it. Existing CRM tests must still pass.
6. A one-off script `npm run storage:check` that uploads a tiny test object to the private bucket, reads a signed URL, then deletes it, so you can confirm real R2 access.

**Done when:** `typecheck`, `lint`, `test`, `build` pass (done), and `storage:check` succeeds against your real bucket (**passed 2026-11-02**). Item 2 is partly open: remove the unused `R2_API_TOKEN` line from `backend/.env` yourself.

### Phase 1: Jobs (backend) — DONE 2026-11-02 (migration `0002` seen in the dev database through pgAdmin; the deploy script migrates the VPS)
1. `recruitment` module skeleton, `schema.ts` for `jobs` and `job_questions`, migration `0002`.
2. `domain/`: job and question zod schemas, the "accepting applications" rule, slug builder, salary checks. Unit tests.
3. `repo/` and `service/`: create, update (with question add, reorder, archive), close, reopen, list, get.
4. Admin controller and DTOs with the permissions in section 5; audit entries `recruitment.job.created|updated|closed|reopened`.
5. E2E tests (real Postgres): create draft, publish, edit questions, close, reopen, validation errors, unauthenticated 401.
6. Module `README.md`; regenerate `openapi.json`.

**Done when:** all checks pass and the endpoints work against a local database (**done 2026-11-02**: against a throwaway PostgreSQL 16, then the 28 recruitment e2e tests passed against the owner's local dev database with no rows left behind). Added beyond the list: `POST /jobs/:id/publish`, so a draft can be published after editing. The application and "new" counts in the job list move to Phase 2, because the applications table does not exist yet.

### Phase 2: Applications (backend) — DONE 2026-11-02
1. Add `applications`, the three child tables, indexes and checks; migration `0003`.
2. `domain/`: phone and email normalisation (tests for every Bangladesh format), application payload schema, resume validation.
3. `repo/` and `service/`: the submission steps in section 5, idempotency, duplicate handling, compensating delete on failure.
4. Public controller (list, one job, submit) with the key guard on submit; employee controller (applications list, detail, status and notes, resume link).
5. E2E tests with a fake storage: happy path, duplicate email, duplicate phone in another format, same person on a different job (allowed), closed job, expired job, missing required answer, wrong file type, fake PDF, oversize file, retry with the same `submissionId`, storage failure rolls back, 401 without the key.
6. Update the module `README.md`; regenerate `openapi.json`.

**Done when:** all checks pass (**done 2026-11-02**: 206 tests against a throwaway PostgreSQL 16, with an in-memory fake storage), plus one real upload through the API to the private bucket and a working signed link (checked manually and reported) (**done 2026-11-02** after the owner applied `0003` to the dev database: one real submission through the API stored the PDF in the private bucket, the signed link downloaded the same bytes and lasted 5 minutes, and the test object and rows were removed afterwards). Differences from the list above: the application and "new" counts moved into the job list and job page here (deferred from Phase 1); `GET /public/jobs` is capped at 100 rows; a retry of an already stored `submissionId` succeeds even after the job closes.

### Phase 3: Admin UI — DONE 2026-11-02
1. Run `api:generate`; add `lib/recruitment/` (queries and mutations, like `lib/crm/leads.ts`); add the nav group.
2. Job list screen, then the opening form with the screening-question builder (create and edit share one component).
3. Job page with the Applications tab and the Details tab (close, reopen).
4. Applicant detail screen with the resume button and status and notes.
5. Loading, empty and error states on every screen; keyboard and mobile checks.
6. Update `admin/README.md` and `admin/MEMORY.md`.

**Done when:** `typecheck`, `lint`, `build` pass, and I have driven the flow in the running app (create, publish, close, reopen) with screenshots. Application screens are checked with test data submitted through the API. (**Met 2026-11-02:** all three pass; the flow was driven in headless Chrome against the running dev servers and the local database, with three test applications submitted through the public API, keyboard checks on the dialog and 390px-wide checks; the test data, resumes and temporary user were removed afterwards. Differences from the list above: the dialog primitive was added (confirmations for close and reopen), and `SortHeader` and `Pagination` were extracted from the CRM list so the three lists share them.)

### Phase 4: Website — DONE 2026-11-02 (built and checked against the local backend; the VPS Nginx limit and a real test email are still open)
1. Raise the Server Action body limit for the form (about 6 MB; I read the Next.js 16 docs in `node_modules/next/dist/docs/` first), or use a route handler if that is cleaner.
2. `lib/careers.ts` (typed fetchers), the `/careers` page and cards, the empty and error states.
3. `/careers/[slug]`: details and the form components (repeatable education and experience rows, questions, resume picker), client checks that mirror the server limits.
4. `submitApplication` Server Action: honeypot, per-IP limit (the backend cannot limit by IP because every request comes from the website's server), forwards multipart with the shared key, maps `ALREADY_APPLIED` and validation errors to friendly messages.
5. The confirmation email (7.1).
6. Add Careers to `SITE.nav`, set the navbar style for the new routes, page metadata through `lib/metadata.ts`.
7. Docs: `frontend/DESIGN.md` (new components, the email exception), `frontend/MEMORY.md`.

**Done when:** `build`, `lint` (including the token check) pass; I have screenshots at desktop and phone width; one real application submitted end to end against a local backend (with email sending **off** unless you allow a test send). (**Met 2026-11-02:** `tsc`, `lint` and `build` pass; screenshots at 1440 and 390 with no horizontal overflow; a real application went through the page and the Server Action to the local backend, the database and the private R2 bucket, the same email and phone were refused as a duplicate, and the test rows and object were removed afterwards. SMTP was blank, so no email was sent; the confirmation was rendered in headless Chrome at 900 and 390 wide instead. Differences from the list above: a Server Action was kept (no route handler) with `serverActions.bodySizeLimit` 6 MB, which applies to every Server Action; the form's field primitives moved from the contact form into `ui/form/Field.tsx`; `lib/careers.ts`, `lib/throttle.ts` and `lib/mailer.ts` were added; the navbar's light theme now matches by route prefix so job pages get it; the Careers hero reuses the Contact page's light hero preset. The decision and gotchas are `frontend/MEMORY.md` D63.)

### Phase 5: Polish and release — DONE 2026-11-02 (everything that can be done off the VPS; the release checklist is the owner's)
1. Google Jobs structured data (`JobPosting` JSON-LD) on job pages, jobs in `sitemap.ts`.
2. Dashboard cards for open jobs and new applications in the admin.
3. Final docs pass, root and folder memory, `CLAUDE.md` notes where needed.
4. Release checklist (section 9) and a full test run.

**Done when:** all checks pass and the checklist is handed over. (**Met 2026-11-02:** backend `typecheck`, `lint` with boundaries, `build` and **all 215 tests in 13 suites** against a throwaway PostgreSQL 16; admin and frontend `typecheck`/`tsc`, `lint` and `build`; `npm audit --omit=dev` reports 0 for frontend and admin and no high or critical for the backend, whose 12 moderate or low items are in dev tooling and older dependencies, none from the recruitment packages.) Differences from the list above: (1) the dashboard cards come from a new `GET /recruitment/stats` (permission `recruitment.application.read`: open positions, those closing within 7 days, new applications, those waiting over 3 days and the six longest-waiting), and long-waiting applications also join the "Needs attention" list, as the CRM's stale leads do; the cards sit in their own Recruitment row because the dashboard now has two modules. (2) `JobPosting` JSON-LD is emitted only while a job accepts applications, and a job that no longer does is `noindex`; **`baseSalary` is deliberately left out** because Google needs a pay period (hour, month, year) and the backend stores none, so an amount would be a guess. To add it, store a period on the job first. (3) `sitemap.ts` is no longer frozen at build time: it refreshes every minute and lists the open jobs (if the backend is down it simply omits them). (4) Stale tables in the root `AGENTS.md` and `ARCHITECTURE.md` ("not started") were corrected and decision S6 added.

## 9. Release checklist (VPS)

- [ ] **(you, on the VPS)** `backend/.env` on the VPS has the `R2_*` values (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET`; the API will not boot without them); `awtomatig-private` has no public URL and no custom domain.
- [ ] **(you, on the VPS)** Nginx for the **website** allows larger bodies: `client_max_body_size 6m;` (the default is 1 MB and would silently reject resumes with a 413).
- [x] Admin Nginx needs no change (the resume link goes straight from R2 to the browser).
- [ ] **(you, on the VPS)** The backend deploys and migrates **before** the website, so the form never posts to a backend that does not know the route. `deploy.sh` is VPS-only, so its order could not be checked from the repository: open it and confirm the backend block runs first. Migrations `0002` and `0003` are applied by that deploy. If the website is built while the backend is down, `/careers` shows its "could not load" message until the backend answers (within a minute); nothing is lost.
- [x] `CRM_API_URL` and `LEAD_INGEST_KEY` are already set in `frontend/.env`; nothing new is needed there. The same file's `SMTP_*` and `CONTACT_TO` are what send the confirmation email.
- [ ] **(you)** Submit one real test application on the live site, check the confirmation email arrives (and looks right in Gmail, Outlook and Apple Mail), check it in the admin and on the dashboard, then delete the test row and the object under `career/<job title>/`. The confirmation email has never been sent through Gmail, only rendered. The admin cannot delete an application, so use a database statement and the Cloudflare dashboard.
- [ ] Never squash migrations `0002` and later after the first deploy.
- [ ] **(you, on the VPS)** Take a `pg_dump` of the production database **before** the deploy (backups are not provisioned yet, and this release starts storing candidates' personal data). Migrations `0002` and `0003` only add a new `recruitment` schema, so the previous app version keeps working if you have to roll back.
- [ ] **(you)** Decide about 2FA: `backend/RULES.md` section 5 requires it before production use with real data, and it is switched off (B10). Applications are real personal data (names, phones, work history, CVs), so either bring it back first or accept the risk knowingly and use a strong administrator password meanwhile.
- [ ] **(you)** The Privacy Policy now covers job applications, resumes, where they are stored and who handles them (written 2026-11-02, `frontend/app/components/sections/shared/legal/legal.ts`). **Read it and have it reviewed** before real candidates apply: it is still a draft. Its retention wording is deliberately non-committal ("as long as needed to consider it and keep a record of our hiring; you can ask us to delete it") because there is no retention period or automatic deletion yet. If you choose a period, change both the policy and the system.
- [ ] **(you, Cloudflare)** `awtomatig-private` has no public access, no `r2.dev` URL and no custom domain (resumes are personal data).
- [ ] **(you)** Read the careers copy on the site and in the email: it was written by Claude (see `frontend/MEMORY.md`).
- [ ] After the first release, give the owner's team the permission names (`recruitment.job.*`, `recruitment.application.*`) when roles other than the administrator are created.

## 10. Risks and notes

| Risk | Mitigation |
| --- | --- |
| Resumes are personal data | Private bucket, signed 5-minute links, every view audited, no personal data in logs. A retention period and delete function come later (you said to skip now). |
| Spam applications | Honeypot, website-side per-IP limit, duplicate rules, 5 MB cap. CAPTCHA (Cloudflare Turnstile) is a later add. |
| Fake PDFs | Header check plus size and type limits. No virus scan now; add ClamAV if volume or risk grows. |
| R2 or backend down at submit | Nothing is stored and the candidate sees "please try again". The file is only kept if the database insert succeeds. |
| Orphan objects (database failure after upload and the cleanup also failing) | Rare; a future cleanup job can list `career/` keys with no application. Logged when it happens. |
| Job text edited after people applied | Answers keep a copy of the question text; questions with answers are archived, not deleted. |
| Public data leaks | Public endpoints use dedicated response shapes (an allow-list), never the raw table row. |

## 11. Not in this plan

Rich-text job descriptions, multiple resumes or cover letters, interview scheduling, team email on new applications, CAPTCHA, retention and auto-delete, per-role permissions, CSV export, candidate-facing application status, applying with a saved profile.
