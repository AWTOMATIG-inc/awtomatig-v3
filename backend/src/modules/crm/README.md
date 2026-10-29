# CRM module

Inquiries from the website's Contact form ("leads"), stored by the website's server and worked on by employees in the admin app. Postgres schema: `crm`. The module sends no email: the website emails the team and the visitor itself (frontend D59 and D60).

## Layout

```
api/       leads.controller.ts, leads.dto.ts (zod DTOs), lead-ingest.guard.ts
service/   leads.service.ts   use cases: capture, list, get, update, stats
domain/    lead.ts            statuses, zod schemas, pure helpers (no framework, no database)
repo/      leads.repo.ts      the only place that reads or writes crm.leads
schema.ts                     the crm.leads table
```

## Endpoints (`/api/v1/crm/leads`)

| Method and path | Who | What |
| --- | --- | --- |
| `POST /` | The website's server, with header `x-ingest-key` = `LEAD_INGEST_KEY` (public otherwise) | Stores a lead. A retry with the same `submissionId` returns the stored lead and adds nothing. Needs `consent: true`. |
| `GET /` | `crm.lead.read` | Paged list (`page`, `pageSize` up to 100, `status`, `q`, `sort` by `createdAt` / `name` / `status`, `order`). No message text in the list. |
| `GET /stats` | `crm.lead.read` | Figures for the dashboard: counts, a bar series (a day per bar up to 7 days, a week per bar beyond), leads waiting more than 2 days, recent activity. `timeZone` decides where a day ends. |
| `GET /:id` | `crm.lead.read` | One lead with its message and notes. |
| `PATCH /:id` | `crm.lead.update` | Changes the status (`new`, `contacted`, `qualified`, `won`, `lost`) and/or the notes (an empty string clears them). |

## Permissions

`crm.lead.read`, `crm.lead.update`. The seeded `admin` role holds `*`. There is no delete yet.

## Data and privacy

A lead holds a name, email, company, budget, the visitor's message and the time they agreed to be contacted. Keep it out of logs and the audit log: `core.audit_log` gets `crm.lead.captured` and `crm.lead.updated` with the lead's id and the changed field names only. The dashboard's activity list looks the name up from the lead at read time.

## Not here yet

Deleting a lead, a retention period for old leads, per-lead history, assigning a lead to an employee, CSV export.
