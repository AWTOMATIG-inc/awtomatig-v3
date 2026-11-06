# HR module (Employees): plan

Status: **planned 2026-11-06, revised the same day after the owner's answers. Phases 1 (backend core) and 2 (documents backend) built and checked 2026-11-06; the admin screens (Phase 3) are written and pass `typecheck`, `lint` and `build`, but the browser run has not been done.** The questions still open in section 3 all have defaults.

What it does: employees of the company are recorded in the admin app under **HR → Employees**. Each employee has an **EMP ID**, personal details, a **department and manager**, employment details, an **employment period calculated automatically**, a **career timeline** (every role they held, with its from / to dates and salary), **documents** (NID, passport, contract and any others, kept in private Cloudflare R2), and a proper **leaving** flow. A profile page shows all of it. A **Departments** screen manages the department list.

This is the first ERP module. It touches `backend/` and `admin/` only. The website (`frontend/`) is not involved.

Folder docs to read before each phase: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), [backend/RULES.md](backend/RULES.md), [admin/ARCHITECTURE.md](admin/ARCHITECTURE.md), [admin/RULES.md](admin/RULES.md), [admin/DESIGN.md](admin/DESIGN.md), `backend/src/modules/recruitment/README.md` (closest existing module: private R2 files and signed links).

---

## 1. What is asked for

| Group | Fields / behaviour |
| --- | --- |
| Personal | Name, Email, Phone, Address, NID |
| Identity | A generated **EMP ID** (e.g. `EMP-0001`) |
| Organisation | **Department** (from a managed list) and **Manager** (another employee) |
| Employment | Designation, Role Type (Part Time, Full Time, Contractual, Internship), Work Mode (Onsite, Hybrid, Remote), Joining Date, Salary, Employment Period (automatic) |
| Career timeline | Every role as its own block: title, **from – to / Present**, salary, with the change between blocks (Marketing Intern → Marketing Executive) |
| Documents | As many rows as needed (NID, passport, contract, certificate, other), each a file in R2 under `hrm/employees/<employee>/…` |
| Leaving | Employees may leave; the record and history are kept and the period stops at the leaving date |
| Profile | One page per employee with all of the above |

## 2. Decisions

Answers from the owner are marked ✔.

| # | Decision | Why |
| --- | --- | --- |
| 1 | **New backend module `hr`, own Postgres schema `hr`.** Tables: `employees`, `employment_records`, `departments`, `employee_documents`. Admin: sidebar group **HR** with **Employees** and **Departments**. | Same shape as `crm`, `recruitment`, `cms`: a module owns its schema and only its repo touches the tables. Departments, documents and (later) leave, attendance and payroll become more tables or modules without touching this design. |
| 2 | **The timeline is the single source of truth for employment details.** `employment_records` holds one row per *stint*: designation, role type, work mode, salary, department and manager, with an `effective_from` date. A stint ends where the next one starts; the last one runs to "Present" (or to the leaving date). **`employees` does not keep a copy of the current values.** "Current" is the newest record with `effective_from` on or before today (Dhaka), read through one SQL view (`hr.employees_current`) that the list, search, filters and sort all use. ✔ (Q8: "each record shown like a timeline", your Marketing Intern → Marketing Executive layout) | A stored copy can go stale or disagree with the timeline, and it would go stale every night as soon as future-dated changes exist (decision 5). One source of truth removes that whole class of bug. At this company size the lookup is a fast indexed query. |
| 3 | **Every employment change is a new timeline record, made on the profile with "Update employment".** The form is pre-filled with the current values, asks for the effective date, a reason and an optional note, and shows a plain summary of what will be recorded ("Designation: Marketing Intern → Marketing Executive · Role type: Internship → Full Time · Salary: 15,000 → 25,000"). One save = one record, even if several fields changed together. Hiring creates the first record, reason "Joined". | Matches how it was described: change the role (and maybe the salary) and the timeline records it. Records are never edited; to fix one you add a Correction or delete a wrong one (decision 6), so the history cannot be quietly rewritten. |
| 4 | **Reasons:** Joined (system only), Promotion, Role type change (e.g. intern → full time), Salary revision, Designation change, Department transfer, Manager change, Work mode change, Correction. Pre-selected from what changed, editable. | A label makes the timeline readable. Correction is shown muted so a typo fix does not look like a career step. |
| 5 | **Future-dated changes are allowed** (Q3 answered "not sure": this is the recommendation). Effective date: not before the joining date and not after the leaving date. A record dated in the future shows as **Scheduled** and takes effect on its day with no job and no extra step. One record per employee per date. | The timeline-only design (decision 2) makes this free, and HR really does record "confirmed as full time from 1 February" in advance. Backdating works the same way, so existing staff can be entered with their real history. |
| 6 | **Records are append and delete only.** A wrongly added record can be deleted (never "Joined", never one that another record's manager link depends on) with a confirmation; the current values follow automatically (decision 2). | Simple, auditable, and "current" can never be wrong because it is never stored. |
| 7 | **Employment period is calculated, never stored.** From the joining date to today, or to the leaving date once the employee has left (Dhaka time). Shown as "2 years, 3 months, 12 days", plus "time in this role" per timeline block. One pure function with tests for month-end cases (31 Jan → 28 Feb) and leap years. | A stored period would be wrong tomorrow. ✔ |
| 8 | **EMP ID** ✔ (Q5): a Postgres sequence gives each employee an integer `employee_no`, shown as `EMP-0001` (the prefix and the minimum width are constants in code). Never reused, never typed by hand, unique. Gaps after a rolled-back create are accepted. | Short, readable, safe to quote in other systems later. An integer is kept so the format can change without a data migration. |
| 9 | **Departments** ✔ (Q6): a managed list (`hr.departments`: name unique, active flag, optional description). Employees get a department through their timeline records, so a transfer is a dated event. Departments are created and edited under HR → Departments; a department in use is **deactivated, not deleted**. | A list, not free text, so reports and filters stay clean. Putting it on the timeline keeps "who was in Marketing in March" answerable. |
| 10 | **Manager** ✔ (Q6): another employee, set on the timeline record too (so manager changes are dated). Rules: not themselves, must not create a loop (A manages B manages A), must not be an employee who has left by the effective date. The profile shows "Manager" and "Direct reports". | Same reason as departments. The loop check protects any future org chart or approval flow. |
| 11 | **Leaving** ✔ (Q4): `employees` gets `left_on`, `exit_type` (resigned, terminated, contract ended, internship ended, retired, other) and `exit_note`. "Mark as left" is a dialog with the date (may be in the future for a notice period), type and note. The employee is **Active** until that date, then **Left**; the list filters on it and defaults to Active. The period and the last timeline block stop at `left_on`; no record may be dated after it. If the employee manages others, the dialog lists their direct reports and lets HR pick a new manager for all of them (each gets a "Manager change" record dated at the leaving date). **Reinstate** undoes a mistaken leaving. Documents are kept. | History must survive: payroll, references and legal retention need the record. Orphaned reports are the usual HR-system bug, so the dialog deals with them at the moment it matters. A real **re-hire after a gap** (a second tenure) is Phase 5; the design leaves room (an additive `tenures` table). |
| 12 | **Documents** ✔ (Q7): table `hr.employee_documents`, as many rows per employee as needed, added and removed from the profile as rows. Each row: type (NID, Passport, Contract, Certificate, CV, Other), a title (required for Other), the file, an optional expiry date (passport), a note. Files: PDF, JPEG, PNG or WebP, up to 5 MB each (the existing upload limit), type read from the file's content, not its name. **Stored in the private R2 bucket** at `hrm/employees/<EMP-0001>-<name-slug>/<type>/<file name>`, e.g. `hrm/employees/EMP-0001-jane-doe/nid/jane-doe-nid.pdf`. An existing file is never replaced (a short id is added to the next one), as with resumes. The exact key is saved in the database, so a later name change never loses a file. Opened only through a **5-minute signed link**. | Follows the owner's folder rule and the recruitment pattern (S6). The EMP ID in the folder name keeps it unique when two people share a name and keeps the path readable. Names in object keys are personal data, acceptable only because the bucket is private and the keys are never shown in a public URL or log. |
| 13 | **Sensitive data** — salary, full NID and documents — **is behind separate permissions, enforced in the API response**, not only on screen. `hr.sensitive.read` shows salary and the full NID (without it: masked NID, last 4 digits, and no salary anywhere, including timeline blocks). `hr.document.read` / `hr.document.manage` for files. Every signed document link issued is written to the audit log. Today only admin accounts exist (Q2 ✔) and the seeded `admin` role holds `*`, so everything works from day one. | Roles can be split later with no code change. A viewing trail for ID documents is cheap now and hard to add later. |
| 14 | **Fields and limits.** Name 2 to 100 chars. Email valid, lower-cased, **unique**. Phone: shape only (digits with an optional `+`, spaces, dashes and brackets, 7 to 25 characters), because staff may have foreign numbers and modules do not import each other. Address up to 300 chars. **NID: digits only, 10, 13 or 17 long, unique.** Designation free text 2 to 80 chars, with suggestions from designations already used. Role type and work mode are fixed lists (database checks). **Salary: one monthly gross amount in BDT** ✔ (Q1), `numeric(19,4)`, `>= 0` (0 is allowed for an unpaid internship), **nullable = "not set"** (someone without `hr.sensitive.read` can hire and change people but cannot set a salary), BDT-only check as on job openings. | Fixed lists cannot drift; free-text designation is how companies name roles. |
| 15 | **Audit** entries hold ids and field names only, never a name, NID, phone, address, email, salary or file name. | `RULES.md` section 3. |
| 16 | **Delete** is only for an employee created by mistake: allowed when nobody reports to them and no other timeline block depends on them; removes their records and their files from R2 (key by key from the database). Anyone who actually worked here is marked as left. Permission `hr.employee.delete`. | Protects the history; the dangerous action is hard to reach by accident. |
| 17 | **Employees are not login users** (no link to `core` users in v1). A nullable `user_id` can be added later without a rewrite. | A person can be on the payroll without a login. |
| 18 | **No new dependency, no website change, no new env var.** One small extension to `StorageService` (delete one private key already exists; add nothing else if every key is deleted individually). Migration `0008_hr_employees` is new tables, a sequence and a view only. | `AGENTS.md` rule 5. |

## 3. Questions still open (each has a default)

| # | Question | My default |
| --- | --- | --- |
| Q9 | Should a department have a **head**? | No: a department is a name and an active flag. Managers are per employee. |
| Q10 | Document types: NID, Passport, Contract, Certificate, CV, Other. Any more? | As listed; "Other" with a title covers the rest. |
| Q11 | How long are documents of **former employees** kept? | Kept until someone deletes them by hand. A retention rule should be set with the owner (and legal advice) before real data goes in. |
| Q12 | Should the 5 MB limit per file be raised (scanned passports can be larger)? | Keep 5 MB; raise later if scans are rejected. |
| Q13 | A person who **returns after leaving**: one continuing record (Reinstate) or a new tenure? | Reinstate for mistakes only; a true re-hire is Phase 5. |

## 4. Architecture

```
Employee browser ─► admin (HR) ─► backend hr module (session cookie, permissions)
                                       │  validates, saves, writes audit entry
                                       ├──► PostgreSQL schema hr
                                       └──► private R2 bucket: hrm/employees/<EMP-0001>-<name>/…  (signed 5-minute links)
```

Module layout follows `recruitment`:

```
backend/src/modules/hr/
  schema.ts            employees, employment_records, departments, employee_documents, employee number sequence, current-state view
  domain/              employee.ts (validation, NID mask, EMP ID format), employment-period.ts, employment-record.ts (reasons, diff, date rules),
                       org.ts (manager loop check), document.ts (types, file checks, key builder)
  repo/                employees, employment-records, departments, documents
  service/             employees.service.ts, departments.service.ts, documents.service.ts (each write in one transaction)
  api/                 controllers + DTOs
  hr.module.ts  README.md
```

## 5. Data model and API

**`hr.employees`** (the person; no employment values):

| Column | Notes |
| --- | --- |
| `id` | UUIDv7 (`baseColumns`), `created_by` / `updated_by` (`authorColumns`) |
| `employee_no` | integer from sequence `hr.employee_no_seq`, unique; `EMP-0001` is built in code |
| `full_name`, `email`, `phone`, `address`, `nid` | text; unique on `lower(email)` and on `nid` |
| `joined_on` | date (Dhaka day) |
| `left_on`, `exit_type`, `exit_note` | nullable; check: `exit_type` in the list; `left_on >= joined_on`; all three set together |

**`hr.employment_records`** (the timeline; each row is the complete state from `effective_from`):

| Column | Notes |
| --- | --- |
| `id`, `created_at`, `created_by` | |
| `employee_id` | references `employees`, `on delete cascade` |
| `effective_from` | date; **unique with `employee_id`**; index `(employee_id, effective_from desc)` |
| `reason` | check: joined, promotion, role_type_change, salary_revision, designation_change, department_transfer, manager_change, work_mode_change, correction |
| `designation`, `employment_type`, `work_mode`, `salary` | complete state (checks as decision 14) |
| `department_id` | references `departments`, `on delete restrict` |
| `manager_id` | nullable, references `employees`, `on delete restrict`, never equals `employee_id` |
| `note` | up to 500 chars |

The "to" date of a block is the next record's `effective_from`, or `left_on`, or "Present"; the difference from the previous block is worked out when reading.

**View `hr.employees_current`**: each employee joined with the newest record where `effective_from <= (now() at time zone 'Asia/Dhaka')::date`, with `status` = Active / Left / Leaving (a future `left_on`) / Not started (joining date in the future). The list, search, filters, sort and the headcount all read this view.

**`hr.departments`**: `id`, `name` (unique, case-insensitive), `description`, `active`, base and author columns.

**`hr.employee_documents`**: `id`, `employee_id` (cascade), `doc_type` (check), `title`, `file_name`, `storage_key` (unique), `content_type`, `size_bytes`, `expires_on` (nullable), `note`, `created_at`, `created_by`.

| Call | Permission | What |
| --- | --- | --- |
| `GET /api/v1/hr/employees` | `hr.employee.read` | List from the view: search (name, email, phone, EMP ID, designation), filter by status, department, role type, work mode, manager; sort; page. Includes the computed period. |
| `POST /api/v1/hr/employees` | `hr.employee.create` | Creates the person and the "Joined" record together. 409 on duplicate email or NID. |
| `GET /api/v1/hr/employees/:id` | `hr.employee.read` | Profile: details, status, computed period, current block, the whole timeline (each block with from, to, duration, salary if allowed, and what changed), manager, direct reports, document list (no links). |
| `PATCH /api/v1/hr/employees/:id` | `hr.employee.update` | Personal details and joining date. The joining date cannot move past the earliest non-"Joined" record. |
| `POST /api/v1/hr/employees/:id/employment-changes` | `hr.employee.update` | One new timeline record (decisions 3 to 5, 10). 400 if nothing changed or a rule breaks. |
| `DELETE /api/v1/hr/employees/:id/employment-changes/:recordId` | `hr.employee.update` | Removes a wrong record (decision 6). 204. |
| `POST /api/v1/hr/employees/:id/leave` / `…/reinstate` | `hr.employee.update` | Mark as left (with optional new manager for direct reports) / undo. |
| `DELETE /api/v1/hr/employees/:id` | `hr.employee.delete` | Decision 16. 204. |
| `GET/POST/PATCH /api/v1/hr/departments`, `…/:id/activate`, `…/:id/deactivate` | `hr.department.read` / `.manage` | Department list and edits. |
| `POST /api/v1/hr/employees/:id/documents` (multipart) | `hr.document.manage` | Add a document row with its file. |
| `GET /api/v1/hr/employees/:id/documents/:docId/link` | `hr.document.read` | `{ url, expiresAt }`, 5 minutes; audited. |
| `PATCH` / `DELETE …/documents/:docId` | `hr.document.manage` | Edit title, expiry, note / remove the row and the R2 file. |
| `GET /api/v1/hr/designations` | `hr.employee.read` | Designations in use, for suggestions. |

Audit actions: `hr.employee.created`, `.updated`, `.left`, `.reinstated`, `.deleted`, `hr.employment.changed`, `.removed`, `hr.department.created`, `.updated`, `.activated`, `.deactivated`, `hr.document.added`, `.updated`, `.removed`, `.viewed`.

## 6. Admin screens

New sidebar group **HR**: **Employees** (`Users` icon) and **Departments** (`Building2` icon) in `lib/nav.ts`. Routes: `/hr/employees`, `/hr/employees/new`, `/hr/employees/[id]`, `/hr/employees/[id]/edit`, `/hr/departments`. Reuses `DataTable`, `PageHeader`, `Field`, `Input`, `Select`, `Textarea`, `StatusBadge`, `Dialog`, `SortHeader`, `Pagination`, `EmptyState`, and the recruitment resume-link pattern. New code in `lib/hr/`. Regenerate the types with `npm run api:generate`. Existing tokens and `type-*` utilities only.

- **Employees list:** EMP ID, Name (email below), Department, Designation, Role type, Work mode, Manager, Joined, Period, Status. Search, filters (default **Active**), sort, paging. No salary or NID columns.
- **Add employee:** cards for Personal, Organisation (department, manager), Employment (designation with suggestions, role type, work mode, joining date, salary). The period shows live under the joining date. Documents are added on the profile after saving.
- **Profile:**
  - Header: name, EMP ID, current designation, status and badges; buttons **Edit details**, **Update employment**, **Mark as left** (or **Reinstate**).
  - Overview: personal details (NID masked, with a Show control only if allowed), department, manager, direct reports, employment period.
  - **Career timeline**, newest first, one block per stint as in the request:
    ```
    ● Marketing Executive          Full Time · Onsite · Marketing · Manager: A. Rahman
      1 Feb 2027 – Present · 9 months                           Salary 25,000 (was 15,000)
      Promotion · "Confirmed after review" · recorded by Admin
    │
    ● Marketing Intern             Internship · Onsite · Marketing
      1 Nov 2026 – 31 Jan 2027 · 3 months                       Salary 15,000
      Joined
    ```
    A future block shows **Scheduled**; the last block of someone who left ends with the leaving date and a **Left** marker. Each block except "Joined" has Remove (with a confirmation). **Add past record** reuses the Update employment dialog for backfilling.
  - **Documents:** a table of rows (type, title, file name, size, expiry, added by) with Open (signed link in a new tab), Edit and Remove, and an **Add document** row/dialog; as many as needed. An expiry within 30 days gets a warning badge.
- **Update employment (dialog):** decisions 3 and 5, with the manager and department pickers, and the plain summary line. Save stays disabled until something differs.
- **Mark as left (dialog):** date, type, note, and the direct-reports reassignment from decision 11.
- **Departments:** list with employee counts, add/edit dialog, deactivate / activate.
- Empty, loading and error states for every screen and a 390px layout for each.

## 7. Phases

Tick a box when it is done and verified.

### Phase 0: owner answers

- [x] Q1 to Q8 answered 2026-11-06 (this revision applies them; Q3 resolved as "allow future-dated").
- [ ] Q9 to Q13: accept the defaults or change them.

### Phase 1: backend core (employees, timeline, departments)

- [x] `schema.ts`, sequence, view, migration `0008_hr_employees` (`npm run db:generate`; read the SQL; the view and sequence are hand-checked); register `HrModule`; module-boundary rule. **Done:** `db:generate` produced the tables only; the view is appended by hand and declared with `.existing()`. All 9 migrations applied to a fresh PostgreSQL 16.
- [x] Domain with unit tests: field and NID validation and masking; EMP ID format; **employment period** (month-end, leap day, same day, exactly one year, stops at the leaving date); record date rules (before joining, after leaving, same date, future = scheduled); diff and reason suggestion; manager loop check. **Done:** 42 unit tests.
- [x] Repos, services (every write in one transaction), DTOs, controllers, permissions, audit; `GET /hr/designations`. Regenerate `openapi.json`. Decision B20 and `modules/hr/README.md`. **Done** (B20 in `backend/ARCHITECTURE.md`, `backend/src/modules/hr/README.md`, `openapi.json` regenerated).
- [x] e2e tests (throwaway PostgreSQL): 401 and 403 on every route; create writes person and "Joined" record; duplicate email and NID; **current values follow the timeline** after create, change, backdated record, future record (current unchanged until its date: tested by passing the date in, not by waiting), and deleting a record; "Joined" cannot be deleted; manager = self, manager loop and a manager who left are refused; department deactivate and in-use rules; leave and reinstate, records after the leaving date refused, direct reports reassigned in the same transaction; **without `hr.sensitive.read` no salary and a masked NID appear in any response**; audit rows hold no personal values; search treats `%` and `_` literally. **Done:** 45 e2e tests; the whole backend suite is 558 tests (27 suites).

**Where Phase 1 differs from this plan (all deliberate):** validation errors are **400**, not 422 (the shared error filter); `salary` is nullable; `departmentId` is optional (an employee can have no department yet); the leaving date counts as a day worked; the view's status values are `active`, `leaving`, `left`, `upcoming`; a leave with direct reports and no `reassignReportsTo` answers 409 with the count; a handover that collides with a change the report already has on or after the leaving date answers 409 and changes nothing; the loop check uses today's managers. **Not done in Phase 1:** migration `0008` on the dev database or VPS (the owner applies it, as before), real R2 (Phase 2).

### Phase 2: backend documents

- [x] Document rules (types, 5 MB, content-sniffed PDF / JPEG / PNG / WebP), key builder `hrm/employees/<EMP-0001>-<name-slug>/<type>/<file name>` (slug of ASCII letters, digits and hyphens; names that slug to nothing fall back to the EMP ID alone), never-overwrite via `putIfAbsent`, add / edit / remove / signed link (audited), cleanup of files on employee delete. **Done:** migration `0009_hr_employee_documents`, `domain/document.ts`, repo, service, controller.
- [x] Tests: wrong type and oversize refused; file name with `..`, slashes or odd characters cannot escape the folder; no overwrite; link expires in 5 minutes; viewing audited; 403 without `hr.document.*`; the real private bucket checked once with `npm run storage:check` style script and the test objects removed. **Done** with an in-memory fake bucket: 29 test suites, 600 tests pass. **The real private bucket was checked on 2026-11-06 at the owner's request and passed** (plain, spaces-and-brackets and Bengali file names; never overwritten; signed link returns the exact bytes; test folder empty afterwards).

**Where Phase 2 differs from this plan (all deliberate):** the profile (`GET /hr/employees/:id`) does not embed the document list; the screen asks `GET /hr/employees/:id/documents`, which has its own permission, so someone without it still sees the profile. Title, expiry and note can be edited (`PATCH`); the type and the file cannot (add a new one and remove the old). A file is checked for its content before anything is stored, so a rejected upload never touches the bucket. The 50-per-employee cap is checked before the upload. `StorageService` has no list or prefix delete for the private bucket, so deleting an employee removes the keys held in the database one by one.

### Phase 3: admin screens

- [x] Nav, Departments, Employees list, Add form. `typecheck`, `lint`, `build`. **Done 2026-11-06:** `lib/nav.ts` (HR group), `app/(app)/hr/departments/`, `app/(app)/hr/employees/` (list, `new/`, `EmployeeForm`, `EmployeePicker`), `lib/hr/`.
- [x] Profile, timeline, Update employment, Add past record, Remove record, Edit details, Mark as left / Reinstate, Documents, delete. `typecheck`, `lint`, `build`. **Done 2026-11-06:** `employees/[id]/` (`page`, `Timeline`, `EmploymentDialog`, `RemoveRecordButton`, `LeaveControls`, `DocumentsCard`, `DeleteEmployeeButton`, `edit/`); shared `ConfirmDialog` and `InlineError`; API types regenerated. All three commands pass and `/hr/*` routes are in the build.
- [ ] **NOT DONE (owner declined the scripted run on 2026-11-06).** Browser run (headless Chrome, dev servers, local database): add an Intern, move to Full Time as Marketing Executive with a raise (timeline matches the layout above), schedule a future change, add three documents and open one, mark a manager as left and reassign the reports, a user without `hr.sensitive.read`; screenshots at 1440 and 390.

### Phase 4: docs and release

- [x] Decisions B20 (backend) and AD16 (admin); both folders' `MEMORY.md` and the root `MEMORY.md`; update the "no CMS or ERP module yet" lines in `AGENTS.md`, `ARCHITECTURE.md`, `MEMORY.md`; READMEs. **Done 2026-11-06.**
- [x] Dashboard cards **Headcount**, **Joined this month**, **Left this month**, **Documents expiring soon** (expired ones named in the card; the worklist lists the earliest six, red when expired) from the new `GET /hr/stats` (`hr.employee.read`). **Done 2026-11-06:** backend typecheck, lint and the SQL checked on the dev database; the e2e tests for it are written but **not run** (no throwaway database available); admin `typecheck`, `lint`, `build` pass; not looked at in a browser. Dashboard cards: (**Headcount**, **Joining / leaving this month**, documents expiring soon) from `GET /hr/stats`.
- [ ] VPS: migrations `0008` and `0009` (the deploy script runs them). No new env var; the private bucket variables already exist.

### Phase 5: later, only if asked

- [ ] Re-hire as a second tenure, CSV export, an org chart from the manager links, linking an employee to a login, leave, attendance, payroll.

## 8. Risks

- **The most sensitive data in the system, and 2FA is still off** (backend B10): NID, passport, address and salary. Bring 2FA back before real employee data goes in.
- **Documents of former employees** need a retention decision (Q11) and, ideally, legal advice.
- **"Current" computed by a view:** simple and always right, but every list query depends on it; it has its own tests and an index on `(employee_id, effective_from desc)`. If the company ever grows to tens of thousands of employees, a materialised current table can be added behind the same view name.
- **Backfilled history is only as good as the information entered:** every record shows who recorded it and when.
- **Names in R2 keys** are personal data; the bucket is private and keys are never logged or exposed, but renaming a person does not rename old keys (by design).
- **Duplicate people:** unique email and NID stop most.
