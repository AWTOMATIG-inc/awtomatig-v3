import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { authorColumns, baseColumns, money, newId } from "../../shared/db/columns";

/** The hr module's own Postgres schema. Only this module's repo reads or writes these tables. */
export const hrSchema = pgSchema("hr");

/** Gives each employee a number for their EMP ID (`EMP-0001`). Never reused; a rolled-back create leaves a gap, which is fine. */
export const employeeNoSeq = hrSchema.sequence("employee_no_seq");

/** A department. In-use departments are deactivated, never deleted, so the timeline keeps its names. */
export const departments = hrSchema.table(
  "departments",
  {
    ...baseColumns,
    ...authorColumns,
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    active: boolean("active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("departments_name_key").on(sql`lower(${table.name})`),
    check("departments_name_check", sql`char_length(${table.name}) between 2 and 80`),
    check("departments_description_check", sql`char_length(${table.description}) <= 300`),
  ],
);

/**
 * A person on the payroll. It holds who they are, not what they do: designation, role type, work mode, salary, department and
 * manager live in `employment_records` (the timeline), and "current" is read from there through the `employees_current` view.
 */
export const employees = hrSchema.table(
  "employees",
  {
    ...baseColumns,
    ...authorColumns,
    /** Shown as `EMP-0001`; the integer is kept so the format can change without a data migration. */
    employeeNo: integer("employee_no")
      .notNull()
      .default(sql`nextval('hr.employee_no_seq')`),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    nid: text("nid").notNull(),
    /** The first day of employment, a Dhaka calendar day. */
    joinedOn: date("joined_on", { mode: "string" }).notNull(),
    /** The last day of employment. In the future while the employee is serving notice. All three exit columns are set together. */
    leftOn: date("left_on", { mode: "string" }),
    exitType: text("exit_type"),
    exitNote: text("exit_note"),
  },
  (table) => [
    uniqueIndex("employees_employee_no_key").on(table.employeeNo),
    uniqueIndex("employees_email_key").on(sql`lower(${table.email})`),
    uniqueIndex("employees_nid_key").on(table.nid),
    index("employees_full_name_idx").on(table.fullName),
    index("employees_joined_on_idx").on(table.joinedOn),
    check("employees_nid_check", sql`${table.nid} ~ '^([0-9]{10}|[0-9]{13}|[0-9]{17})$'`),
    check(
      "employees_exit_type_check",
      sql`${table.exitType} is null or ${table.exitType} in ('resigned', 'terminated', 'contract_ended', 'internship_ended', 'retired', 'other')`,
    ),
    check(
      "employees_exit_together_check",
      sql`(${table.leftOn} is null and ${table.exitType} is null and ${table.exitNote} is null) or (${table.leftOn} is not null and ${table.exitType} is not null)`,
    ),
    check("employees_left_after_joined_check", sql`${table.leftOn} is null or ${table.leftOn} >= ${table.joinedOn}`),
  ],
);

/**
 * The career timeline: one row per stint, holding the complete employment state from `effective_from` until the next row starts.
 * Rows are added and deleted, never edited, so the history cannot be rewritten quietly.
 */
export const employmentRecords = hrSchema.table(
  "employment_records",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by"),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    reason: text("reason").notNull(),
    designation: text("designation").notNull(),
    employmentType: text("employment_type").notNull(),
    workMode: text("work_mode").notNull(),
    /** Monthly gross in BDT. Null = not set (the person who recorded it was not allowed to see or set salaries). */
    salary: money("salary"),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "restrict" }),
    managerId: uuid("manager_id").references(() => employees.id, { onDelete: "restrict" }),
    note: text("note"),
  },
  (table) => [
    uniqueIndex("employment_records_employee_date_key").on(table.employeeId, table.effectiveFrom),
    index("employment_records_manager_idx").on(table.managerId),
    index("employment_records_department_idx").on(table.departmentId),
    check(
      "employment_records_reason_check",
      sql`${table.reason} in ('joined', 'promotion', 'role_type_change', 'salary_revision', 'designation_change', 'department_transfer', 'manager_change', 'work_mode_change', 'correction')`,
    ),
    check("employment_records_designation_check", sql`char_length(${table.designation}) between 2 and 80`),
    check(
      "employment_records_employment_type_check",
      sql`${table.employmentType} in ('full_time', 'part_time', 'contractual', 'internship')`,
    ),
    check("employment_records_work_mode_check", sql`${table.workMode} in ('onsite', 'hybrid', 'remote')`),
    check("employment_records_salary_check", sql`${table.salary} is null or ${table.salary} >= 0`),
    check(
      "employment_records_manager_not_self_check",
      sql`${table.managerId} is null or ${table.managerId} <> ${table.employeeId}`,
    ),
    check("employment_records_note_check", sql`${table.note} is null or char_length(${table.note}) <= 500`),
  ],
);

/**
 * A file kept for an employee (NID, passport, contract, …): as many rows as needed. The bytes are in the private R2 bucket under
 * `hrm/employees/<EMP-0001-name>/<type>/<file>`; Postgres keeps the exact key, so renaming the person never loses a file.
 */
export const employeeDocuments = hrSchema.table(
  "employee_documents",
  {
    ...baseColumns,
    ...authorColumns,
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(),
    /** What the row is called when the type is not enough (required for `other`). */
    title: text("title").notNull().default(""),
    /** The name the file was uploaded with, for display only. */
    fileName: text("file_name").notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** For documents that lapse, such as a passport. */
    expiresOn: date("expires_on", { mode: "string" }),
    note: text("note").notNull().default(""),
  },
  (table) => [
    uniqueIndex("employee_documents_storage_key_key").on(table.storageKey),
    index("employee_documents_employee_idx").on(table.employeeId, table.createdAt),
    index("employee_documents_expires_on_idx").on(table.expiresOn),
    check(
      "employee_documents_doc_type_check",
      sql`${table.docType} in ('nid', 'passport', 'contract', 'certificate', 'cv', 'other')`,
    ),
    check("employee_documents_title_check", sql`char_length(${table.title}) <= 100`),
    check("employee_documents_note_check", sql`char_length(${table.note}) <= 300`),
    check("employee_documents_size_check", sql`${table.sizeBytes} > 0`),
  ],
);

/**
 * Each employee joined with the record in force today (Dhaka): the newest record dated on or before today, or the earliest one
 * while the employee has not started yet. Created by hand in migration `0008` (`.existing()` keeps drizzle-kit from managing it).
 * The list, search, filters and sorting all read this, so "current" is never stored and cannot go stale.
 */
export const employeesCurrent = hrSchema
  .view("employees_current", {
    id: uuid("id").notNull(),
    employeeNo: integer("employee_no").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    nid: text("nid").notNull(),
    joinedOn: date("joined_on", { mode: "string" }).notNull(),
    leftOn: date("left_on", { mode: "string" }),
    exitType: text("exit_type"),
    exitNote: text("exit_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
    recordId: uuid("record_id"),
    effectiveFrom: date("effective_from", { mode: "string" }),
    designation: text("designation"),
    employmentType: text("employment_type"),
    workMode: text("work_mode"),
    salary: money("salary"),
    departmentId: uuid("department_id"),
    departmentName: text("department_name"),
    managerId: uuid("manager_id"),
    managerName: text("manager_name"),
    managerEmployeeNo: integer("manager_employee_no"),
  })
  .existing();
