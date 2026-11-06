# HR module

Employees, their career timeline and departments. The first ERP module. Plan and phases: [../../../../HR_PLAN.md](../../../../HR_PLAN.md). Decision: B20 in [../../../ARCHITECTURE.md](../../../ARCHITECTURE.md).

**Built so far (Phases 1 and 2):** employees, the timeline, leaving, departments, and documents (NID, passport, … in private R2). **Not yet:** the admin screens (Phase 3).

## The idea

- `hr.employees` holds the **person**: EMP ID, name, email, phone, address, NID, joining date and, once they leave, the leaving date, type and note. It holds **no** designation, role type, work mode, salary, department or manager.
- `hr.employment_records` is the **timeline**: one row per stint, the complete state from `effective_from` until the next row starts. Rows are added and deleted, never edited.
- **"Current" is never stored.** The view `hr.employees_current` joins each employee with the newest record dated on or before today (Dhaka), or the earliest one while they have not started yet. The list, search, filters and sorting read it. A change dated in the future is "Scheduled" and takes effect on its day with no job.
- **Employment period is calculated**, never stored (`domain/employment-period.ts`): joining date up to today, or up to and including the leaving date.

## Layout

```
api/       employees.controller.ts   EmployeesController, DesignationsController (employees, timeline, leaving)
           departments.controller.ts DepartmentsController
           documents.controller.ts   DocumentsController (list, add, link, edit, remove)
           document-form.ts          reads the multipart upload (HTTP only)
           documents.dto.ts          zod DTOs
           employees.dto.ts          zod DTOs for both
service/   employees.service.ts      create, list, get, update, changeEmployment, removeEmployment, leave, reinstate, remove, designations
           departments.service.ts    create, list, get, update, activate / deactivate
           documents.service.ts      list, add (checks the file, stores it, records it), link, update, remove
           unique-violation.ts       recognises PostgreSQL error 23505
domain/    employee.ts               lists (role type, work mode, exit type, status), EMP ID, NID mask and pattern, zod schemas
           employment-period.ts      Dhaka today, the period calculation, date helpers
           employment-record.ts      reasons, state diff, suggested reason, effective-date rule, builds the timeline blocks
           org.ts                    reporting-loop check
           department.ts             zod schemas
           document.ts               types, content detection (PDF / JPEG / PNG / WebP), employee folder and object-key builder, zod schemas
repo/      employees.repo.ts         the only code that touches hr.employees and reads the view
           employment-records.repo.ts
           departments.repo.ts
           documents.repo.ts
schema.ts                            hr.employees, hr.employment_records, hr.departments, hr.employee_documents, hr.employee_no_seq, the view definition for drizzle
```

The view is created by hand at the end of migration `0008_hr_employees` and declared in `schema.ts` with `.existing()` so drizzle-kit does not manage it. **If a column is added to `employees` or `employment_records` that the view should show, change the view in a new migration (`CREATE OR REPLACE VIEW`, new columns last).**

## Endpoints (all need a session; base `/api/v1/hr`)

| Method and path | Permission | What |
| --- | --- | --- |
| `GET /employees` | `hr.employee.read` | Paged list from the view. `q` (name, email, phone, designation, EMP ID), `status` (`working` default = active + serving notice, `left`, `upcoming`, `all`), `departmentId`, `managerId`, `employmentType`, `workMode`, `sort` (`fullName`, `employeeNo`, `joinedOn`, `designation`), `order`, `page`, `pageSize` up to 100. Never contains NID or salary. |
| `POST /employees` | `hr.employee.create` | Creates the person and the "Joined" entry in one transaction. 409 on a duplicate email (any case) or NID. A `salary` needs `hr.sensitive.read` (403 otherwise; it is then left unset). |
| `GET /employees/:id` | `hr.employee.read` | Profile: details, status, period, direct reports and the timeline (newest first) with each block's from, to, length and what changed. |
| `PATCH /employees/:id` | `hr.employee.update` | Personal details and joining date only. The joining date must stay before the first non-"Joined" entry, and moves the "Joined" entry with it. |
| `POST /employees/:id/employment-changes` | `hr.employee.update` | Adds one timeline entry. Only the fields sent change; the rest carry forward from the stint before `effectiveFrom`. The reason is worked out when not sent. Past dates fill in history, future dates schedule. 409 if there is already an entry that day; 400 for no change, a date before joining or after leaving, a bad manager or department. |
| `DELETE /employees/:id/employment-changes/:recordId` | `hr.employee.update` | Removes a wrong entry. Never the "Joined" one (409). |
| `POST /employees/:id/leave` | `hr.employee.update` | `leftOn` (may be ahead), `exitType`, `exitNote`, and `reassignReportsTo` (a person, or `null` for nobody). If people report to the employee and `reassignReportsTo` is missing: 409 with `details.directReports`. Each report gets a "Manager change" entry on the leaving date. |
| `POST /employees/:id/reinstate` | `hr.employee.update` | Clears the leaving date. For a mistake; a real re-hire after a gap is a later phase. |
| `DELETE /employees/:id` | `hr.employee.delete` | For a record created by mistake. 409 when someone's history names the employee as manager. |
| `GET /designations` | `hr.employee.read` | Designations in use, most used first. |
| `GET /stats` | `hr.employee.read` | Dashboard figures: headcount, joined / left this month, documents expiring within 30 days (or expired) and the earliest six. |
| `GET/POST /departments`, `GET/PATCH /departments/:id`, `POST /departments/:id/activate`, `…/deactivate` | `hr.department.read` / `hr.department.manage` | Departments with the number of people in each. Unique names in any case. A department is deactivated, never deleted. |

## Documents (Phase 2; migration `0009_hr_employee_documents`)

As many rows per employee as needed (at most 50), each a file in the **private** R2 bucket. Under `/api/v1/hr/employees/:id/documents`:

| Method and path | Permission | What |
| --- | --- | --- |
| `GET /` | `hr.document.read` | The employee's documents, oldest first: type, title, uploaded name, content type, size, expiry, note, who added it. **Never** a link or an object key. |
| `POST /` | `hr.document.manage` | `multipart/form-data`: one `file` (PDF, JPEG, PNG or WebP, 5 MB at most) plus `docType` (`nid`, `passport`, `contract`, `certificate`, `cv`, `other`), `title` (required for `other`, up to 100), `expiresOn` (optional date; an empty value means none) and `note` (up to 300). 400 for anything else, 404 for an unknown employee, 409 at 50 documents. |
| `GET /:docId/link` | `hr.document.read` | `{ url, expiresAt }`: a signed link that works for **5 minutes**. Every link issued is written to the audit log (`hr.document.viewed`). 404 if the file is missing from storage. |
| `PATCH /:docId` | `hr.document.manage` | Title, expiry (`null` clears it) and note. The type and the file cannot change: add a new one and remove the old. |
| `DELETE /:docId` | `hr.document.manage` | Removes the row, then the file. |

- **Where files go:** `hrm/employees/<EMP-0001>-<name-slug>/<type>/<file name>.<ext>`, for example `hrm/employees/EMP-0001-jane-doe/nid/jane-nid.pdf`. The slug is the name in ASCII letters, digits and dashes (a name with none leaves just `EMP-0001`). The extension and content type come from the file's **first bytes**, never its name or declared type. A file name cannot escape the folder (no slashes, no leading dots).
- **Never replaced:** the upload uses the conditional put (`StorageService.putIfAbsent`); a taken name gets a short id from the document, then the whole id. The exact key is saved in `storage_key`, so renaming the person never moves or loses a file, and new files go to the new name's folder.
- **Failures:** if the record cannot be saved the stored file is removed again; if storage fails the answer is 503 and no row is written; a file that cannot be removed after a delete is logged by document id (never by key) and the row stays removed.
- **Employee delete** removes the files too. **Marking someone as left keeps them.**
- **Permissions are separate from the people permissions:** `hr.employee.*` and `hr.sensitive.read` do not open the files.
- Object keys contain the employee's name, so they are never returned, logged or put in the audit log. Audit actions: `hr.document.added / .updated / .removed / .viewed` with the document id and type only.

**Errors:** validation failures are **400**, not 422 (the shared error filter). The body is `{ code, message, details }`; for rule failures `details` is keyed by field (`effectiveFrom`, `managerId`, `email`, …).

## Rules worth knowing

- **Salary and the full NID are sensitive.** Without `hr.sensitive.read` the API sends the NID masked to its last four digits and **no salary anywhere** (profile, timeline blocks, change lists). The check is in the service, not the screen. Salary and NID are never in the list.
- **Salary is nullable.** Someone without `hr.sensitive.read` can hire and change people but cannot set a salary, so it stays "not set" until someone with the permission records one.
- **Dates** are Dhaka calendar days (`YYYY-MM-DD`). The leaving date is a day worked: 1 Aug to 30 Sep inclusive is exactly 2 months.
- **A change is checked only for what it changes.** A department that has since been deactivated, or a manager who has since left, does not block an unrelated change; picking one for a change does.
- **A backdated entry does not rewrite later ones.** Each entry holds the complete state; adding history in the middle describes only that stretch, and the present stays as the newest entry says.
- **Manager loops** are checked against today's managers (`employees_current`), which is exact for today's chart and a close approximation for dated changes.
- **Audit** entries hold ids and field names only, never a name, NID, phone, address, email, salary or note: `hr.employee.created / .updated / .left / .reinstated / .deleted`, `hr.employment.changed / .removed`, `hr.department.created / .updated / .activated / .deactivated`.
- Concurrency: every write that touches one employee locks that employee's row (`SELECT … FOR UPDATE`) first, so two people cannot change the same history at once.

## Tests

`src/modules/hr/domain/*.spec.ts` (unit tests: period maths, EMP ID, NID, reasons, timeline, loops, document detection and keys), `test/hr.e2e-spec.ts` (45 tests: employees, timeline, departments, leaving) and `test/hr-documents.e2e-spec.ts` (documents, with an in-memory fake bucket so nothing touches R2). The e2e suites need a real migrated PostgreSQL (set `TEST_DATABASE_URL`) and create and remove their own users, roles, departments and employees.
