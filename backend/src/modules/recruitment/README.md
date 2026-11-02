# Recruitment module

Job openings that employees create in the admin app, the public careers endpoints the website reads, and the applications candidates send. Plan and phases: [../../../../RECRUITMENT_PLAN.md](../../../../RECRUITMENT_PLAN.md). Postgres schema: `recruitment`. The module sends no email: the website sends the candidate's confirmation. Resumes are stored through the shared `StorageService` (private R2 bucket).

## Layout

```
api/       jobs.controller.ts            employee job endpoints
           applications.controller.ts    PublicJobsController (careers + submit) and ApplicationsController (review)
           application-form.ts           reads the multipart request (HTTP only)
           jobs.dto.ts, applications.dto.ts   zod DTOs
service/   jobs.service.ts               jobs: create, list, get, edit, publish, close, reopen, public reads
           applications.service.ts       applications: submit, list, get, update, resume link
domain/    job.ts, application.ts        enums, zod schemas, rules, phone / email / slug / salary / deadline / resume helpers (no framework, no database)
repo/      jobs.repo.ts, applications.repo.ts   the only code that touches the tables
schema.ts                                jobs, job_questions, applications, application_educations, application_experiences, application_answers
```

## Employee endpoints (all need a session)

Jobs, under `/api/v1/recruitment/jobs`:

| Method and path | Permission | What |
| --- | --- | --- |
| `GET /` | `recruitment.job.read` | Paged list (`page`, `pageSize` up to 100, `status`, `q` on the title, `sort` by `createdAt` / `deadlineOn` / `title`, `order`). Each row has `applicationCount` and `newApplicationCount`. No description or questions. |
| `POST /` | `recruitment.job.create` | Creates a job with its questions. `publish: true` opens it at once, otherwise it is a `draft`. |
| `GET /:id` | `recruitment.job.read` | One job with its active questions in order. |
| `PATCH /:id` | `recruitment.job.update` | Changes any fields. `questions`, when sent, is the full ordered list of active questions: an entry with an `id` is edited and moved, one without is added, an active question left out is archived. |
| `POST /:id/publish` | `recruitment.job.update` | Draft to open. 409 if not a draft; 400 if the deadline has passed. |
| `POST /:id/close` | `recruitment.job.update` | Open to closed, effective at once. 409 if not open. |
| `POST /:id/reopen` | `recruitment.job.update` | Closed to open. Optional body `{ deadlineOn }`, needed when the stored deadline has passed. 409 if not closed. |

Applications, under `/api/v1/recruitment`:

| Method and path | Permission | What |
| --- | --- | --- |
| `GET /jobs/:id/applications` | `recruitment.application.read` | Paged list for one job (`page`, `pageSize`, `status`, `q` on name or email, `sort` by `createdAt` / `fullName` / `status`, `order`). Name, email, phone, status, date only: no answers. 404 for an unknown job. |
| `GET /applications/:id` | `recruitment.application.read` | Everything: contact, links, resume name and size, education, experience, the answers with the question text as it was when answered, notes. |
| `PATCH /applications/:id` | `recruitment.application.update` | Status (`new`, `shortlisted`, `interview`, `hired`, `rejected`) and/or notes (an empty string clears them). |
| `GET /stats` | `recruitment.application.read` | The dashboard's figures: `openJobs` (open and not past the deadline), `closingSoon` (of those, within `closingSoonDays` = 7), `newApplications` (status `new`), `staleCount` (new and waiting over `staleAfterDays` = 3) and `stale`, the six longest-waiting as `{ id, fullName, jobId, jobTitle, createdAt }`. Counts and a name only. |
| `GET /applications/:id/resume` | `recruitment.application.read` | `{ url, expiresAt }`: a signed R2 link valid for 5 minutes. 404 if the file is missing. Every request is written to the audit log. |

## Public endpoints (for the website's server)

Under `/api/v1/recruitment/public/jobs`. They return an allow-listed shape, never the raw row: no status, no audit columns, no job id.

| Method and path | Who | What |
| --- | --- | --- |
| `GET /` | Anyone | Open jobs whose deadline has not passed, soonest deadline first, at most 100. |
| `GET /:slug` | Anyone | One job with its questions (their ids are what the form sends back). A closed or expired job returns 200 with `acceptingApplications: false`; a draft or unknown slug returns 404. |
| `POST /:slug/applications` | The website's server, header `x-ingest-key` = `LEAD_INGEST_KEY` | Submits an application. Returns `201 { id }`. |

### Submitting

`multipart/form-data` with a JSON `payload` field and exactly one PDF file named `resume`. The payload holds `submissionId` (a UUID per form submission), `fullName`, `email`, `phone`, optional `githubUrl` / `linkedinUrl`, `educations` (at least one, at most 10), `experiences` (optional, at most 15), `answers` (`{ questionId, answer }`), and `consent: true`. Steps, in order:

1. The job must exist and not be a draft (404).
2. The payload is validated by zod (400 `VALIDATION_FAILED`, `details` is a list of `{ path, message }` the form can show next to each field).
3. A `submissionId` already stored returns the stored application (`201`, same id, nothing uploaded), even if the job has closed since: a retry never turns into an error.
4. The job must be accepting applications (409 `NOT_ACCEPTING_APPLICATIONS`).
5. Every required question needs a non-empty answer; answers may only be for the job's active questions, each once (400). A blank answer to an optional question is not stored.
6. The resume must be a real PDF: `.pdf` name, `application/pdf` type, starts with `%PDF-`, not empty, at most 5 MB (400). The size is capped while streaming, so a bigger upload is never held in memory.
7. One application per job for each email and each phone number (409 `ALREADY_APPLIED`, message "You have already applied for this position"). Email is compared lowercased; phone is reduced to digits and Bangladesh mobiles are made alike (`01712345678`, `+8801712345678`, `8801712345678`, `008801712345678`, `+88 01712-345678` and `1712345678` are one number).
8. The PDF is uploaded to `career/<job title>/<file name>.pdf` (see "Resume keys" below). If storage fails, nothing is stored (503 `STORAGE_UNAVAILABLE`).
9. The application, its education, experience and answer rows and the audit entry are written in one transaction. If that fails the uploaded file is deleted again (best effort, logged if it cannot be). Two simultaneous submissions that both passed step 7 are stopped by the unique indexes; the loser's file is deleted and it gets `ALREADY_APPLIED`.

## Rules worth knowing

- **Accepting applications** is derived, never stored: `status = 'open'` and `deadlineOn` is today (Asia/Dhaka) or later. `isAcceptingApplications` in `domain/job.ts` is the only place that rule lives. No scheduled job closes anything.
- **Deadline** is a `YYYY-MM-DD` date, valid through the end of that day in Dhaka. A new or changed deadline cannot be in the past.
- **Salary** is BDT only, sent and returned as decimal strings, never floats. Both empty = negotiable, only the minimum = fixed, both = a range; a maximum needs a minimum and cannot be below it.
- **Slug** is the title plus six random hex characters, fixed at creation so shared links survive a title change.
- **Questions** are free text, at most 20 active per job. They are never deleted, only archived. An answer keeps a copy of the question text, so editing a question never rewrites an old application.
- **Education** needs either a completion date or "ongoing", never both and never neither; **experience** needs either an end date or "current". Both are also database checks.
- **Links** must be `https://` on github.com / linkedin.com (or a subdomain), with no embedded credentials.
- **Resume keys** are `career/<job title>/<file name>.pdf` (B15): the job's title as the folder and the candidate's own file name, both made safe first (letters and digits of any script, spaces and `. _ - ( )` only; no slashes, no `..`; a title or name with nothing readable left becomes `job` / `resume`; at most 80 and 120 characters). The upload is conditional (`If-None-Match: *`), so a file is **never replaced**: if the name is taken (two candidates both call theirs `resume.pdf`), the next candidate's file gets a short piece of their application id (`resume-3e4f5a6b.pdf`), then the whole id. The chosen key is saved in `applications.resume_key`, so renaming a job later never loses a file, and old keys keep working. The key contains a candidate's file name, which can hold their name: it is never logged, audited or returned by the API (the audit log has ids only). The original name is also kept in the database for display, with folders and control characters removed.
- **Status values** are `text` columns with `check` constraints (as in `crm`), not Postgres enums.
- State changes on a job lock its row (`select … for update`), so two employees cannot publish, close or reopen it at once.
- Applications are never deleted by the API. A retention period and a delete function come later.

## Permissions

`recruitment.job.read`, `recruitment.job.create`, `recruitment.job.update`, `recruitment.application.read`, `recruitment.application.update`. The seeded `admin` role holds `*`. There is no delete.

## Data and privacy

Job text is public once published and holds no personal data. An application holds a name, email, phone, links, education, work history, free-text answers and a resume: keep all of it out of logs and the audit log. `core.audit_log` gets `recruitment.job.created` / `.updated` / `.published` / `.closed` / `.reopened`, `recruitment.application.submitted` (job id only), `.updated` (field names and the new status) and `.resume_viewed` (job id only), each with the entity id and never the text. Storage errors are logged by name and HTTP status only.

## Not here yet

Deleting an application or a job, a retention period, CSV export, an email to the team on a new application, CAPTCHA, a cleanup job for orphaned resume files (a database failure plus a failed delete leaves one under `career/`; it is logged).
