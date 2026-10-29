import { check, index, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { authorColumns, baseColumns } from "../../shared/db/columns";

/** The CRM module's own Postgres schema. Only this module's repo reads or writes these tables. */
export const crmSchema = pgSchema("crm");

/** An inquiry from the website's Contact form. Personal data: keep it out of logs and the audit log. */
export const leads = crmSchema.table(
  "leads",
  {
    ...baseColumns,
    ...authorColumns,
    /** The website's id for one form submission; makes a retried submission harmless. */
    submissionId: uuid("submission_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company").notNull().default(""),
    budget: text("budget").notNull().default(""),
    helpWith: text("help_with").notNull(),
    projectType: text("project_type").notNull(),
    message: text("message").notNull(),
    source: text("source").notNull().default("website-contact"),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("new"),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("leads_submission_id_key").on(table.submissionId),
    index("leads_status_created_at_idx").on(table.status, table.createdAt),
    index("leads_created_at_idx").on(table.createdAt),
    check("leads_status_check", sql`${table.status} in ('new', 'contacted', 'qualified', 'won', 'lost')`),
  ],
);
