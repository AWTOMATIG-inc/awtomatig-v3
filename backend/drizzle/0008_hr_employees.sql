CREATE SCHEMA "hr";
--> statement-breakpoint
CREATE SEQUENCE "hr"."employee_no_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "hr"."departments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "departments_name_check" CHECK (char_length("hr"."departments"."name") between 2 and 80),
	CONSTRAINT "departments_description_check" CHECK (char_length("hr"."departments"."description") <= 300)
);
--> statement-breakpoint
CREATE TABLE "hr"."employees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"employee_no" integer DEFAULT nextval('hr.employee_no_seq') NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"nid" text NOT NULL,
	"joined_on" date NOT NULL,
	"left_on" date,
	"exit_type" text,
	"exit_note" text,
	CONSTRAINT "employees_nid_check" CHECK ("hr"."employees"."nid" ~ '^([0-9]{10}|[0-9]{13}|[0-9]{17})$'),
	CONSTRAINT "employees_exit_type_check" CHECK ("hr"."employees"."exit_type" is null or "hr"."employees"."exit_type" in ('resigned', 'terminated', 'contract_ended', 'internship_ended', 'retired', 'other')),
	CONSTRAINT "employees_exit_together_check" CHECK (("hr"."employees"."left_on" is null and "hr"."employees"."exit_type" is null and "hr"."employees"."exit_note" is null) or ("hr"."employees"."left_on" is not null and "hr"."employees"."exit_type" is not null)),
	CONSTRAINT "employees_left_after_joined_check" CHECK ("hr"."employees"."left_on" is null or "hr"."employees"."left_on" >= "hr"."employees"."joined_on")
);
--> statement-breakpoint
CREATE TABLE "hr"."employment_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"employee_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"reason" text NOT NULL,
	"designation" text NOT NULL,
	"employment_type" text NOT NULL,
	"work_mode" text NOT NULL,
	"salary" numeric(19, 4),
	"department_id" uuid,
	"manager_id" uuid,
	"note" text,
	CONSTRAINT "employment_records_reason_check" CHECK ("hr"."employment_records"."reason" in ('joined', 'promotion', 'role_type_change', 'salary_revision', 'designation_change', 'department_transfer', 'manager_change', 'work_mode_change', 'correction')),
	CONSTRAINT "employment_records_designation_check" CHECK (char_length("hr"."employment_records"."designation") between 2 and 80),
	CONSTRAINT "employment_records_employment_type_check" CHECK ("hr"."employment_records"."employment_type" in ('full_time', 'part_time', 'contractual', 'internship')),
	CONSTRAINT "employment_records_work_mode_check" CHECK ("hr"."employment_records"."work_mode" in ('onsite', 'hybrid', 'remote')),
	CONSTRAINT "employment_records_salary_check" CHECK ("hr"."employment_records"."salary" is null or "hr"."employment_records"."salary" >= 0),
	CONSTRAINT "employment_records_manager_not_self_check" CHECK ("hr"."employment_records"."manager_id" is null or "hr"."employment_records"."manager_id" <> "hr"."employment_records"."employee_id"),
	CONSTRAINT "employment_records_note_check" CHECK ("hr"."employment_records"."note" is null or char_length("hr"."employment_records"."note") <= 500)
);
--> statement-breakpoint
ALTER TABLE "hr"."employment_records" ADD CONSTRAINT "employment_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr"."employment_records" ADD CONSTRAINT "employment_records_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "hr"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr"."employment_records" ADD CONSTRAINT "employment_records_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "hr"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "departments_name_key" ON "hr"."departments" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_no_key" ON "hr"."employees" USING btree ("employee_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_key" ON "hr"."employees" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "employees_nid_key" ON "hr"."employees" USING btree ("nid");--> statement-breakpoint
CREATE INDEX "employees_full_name_idx" ON "hr"."employees" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "employees_joined_on_idx" ON "hr"."employees" USING btree ("joined_on");--> statement-breakpoint
CREATE UNIQUE INDEX "employment_records_employee_date_key" ON "hr"."employment_records" USING btree ("employee_id","effective_from");--> statement-breakpoint
CREATE INDEX "employment_records_manager_idx" ON "hr"."employment_records" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "employment_records_department_idx" ON "hr"."employment_records" USING btree ("department_id");
--> statement-breakpoint
-- Each employee with the record in force today in Dhaka: the newest record dated on or before today, or the earliest one while
-- the employee has not started yet. "Current" is never stored, so it cannot go stale. Hand-written; drizzle-kit does not manage it.
CREATE VIEW "hr"."employees_current" AS
SELECT
	e."id",
	e."employee_no",
	e."full_name",
	e."email",
	e."phone",
	e."address",
	e."nid",
	e."joined_on",
	e."left_on",
	e."exit_type",
	e."exit_note",
	e."created_at",
	e."updated_at",
	CASE
		WHEN e."left_on" IS NOT NULL AND e."left_on" <= (now() AT TIME ZONE 'Asia/Dhaka')::date THEN 'left'
		WHEN e."left_on" IS NOT NULL THEN 'leaving'
		WHEN e."joined_on" > (now() AT TIME ZONE 'Asia/Dhaka')::date THEN 'upcoming'
		ELSE 'active'
	END AS "status",
	r."id" AS "record_id",
	r."effective_from",
	r."designation",
	r."employment_type",
	r."work_mode",
	r."salary",
	r."department_id",
	d."name" AS "department_name",
	r."manager_id",
	m."full_name" AS "manager_name",
	m."employee_no" AS "manager_employee_no"
FROM "hr"."employees" e
LEFT JOIN LATERAL (
	SELECT x.*
	FROM "hr"."employment_records" x
	WHERE x."employee_id" = e."id"
	ORDER BY
		(x."effective_from" > (now() AT TIME ZONE 'Asia/Dhaka')::date),
		CASE WHEN x."effective_from" <= (now() AT TIME ZONE 'Asia/Dhaka')::date THEN x."effective_from" END DESC,
		x."effective_from" ASC
	LIMIT 1
) r ON true
LEFT JOIN "hr"."departments" d ON d."id" = r."department_id"
LEFT JOIN "hr"."employees" m ON m."id" = r."manager_id";
