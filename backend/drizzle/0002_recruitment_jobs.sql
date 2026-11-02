CREATE SCHEMA "recruitment";
--> statement-breakpoint
CREATE TABLE "recruitment"."job_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"job_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "job_questions_position_check" CHECK ("recruitment"."job_questions"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "recruitment"."jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"job_type" text NOT NULL,
	"work_mode" text NOT NULL,
	"salary_min" numeric(19, 4),
	"salary_max" numeric(19, 4),
	"salary_currency" text DEFAULT 'BDT' NOT NULL,
	"vacancies" integer DEFAULT 1 NOT NULL,
	"office_timing" text NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text DEFAULT '' NOT NULL,
	"benefits" text DEFAULT '' NOT NULL,
	"deadline_on" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	CONSTRAINT "jobs_job_type_check" CHECK ("recruitment"."jobs"."job_type" in ('full_time', 'part_time', 'contractual')),
	CONSTRAINT "jobs_work_mode_check" CHECK ("recruitment"."jobs"."work_mode" in ('onsite', 'remote', 'hybrid')),
	CONSTRAINT "jobs_status_check" CHECK ("recruitment"."jobs"."status" in ('draft', 'open', 'closed')),
	CONSTRAINT "jobs_salary_currency_check" CHECK ("recruitment"."jobs"."salary_currency" = 'BDT'),
	CONSTRAINT "jobs_vacancies_check" CHECK ("recruitment"."jobs"."vacancies" >= 1),
	CONSTRAINT "jobs_salary_range_check" CHECK ("recruitment"."jobs"."salary_max" is null or ("recruitment"."jobs"."salary_min" is not null and "recruitment"."jobs"."salary_max" >= "recruitment"."jobs"."salary_min"))
);
--> statement-breakpoint
ALTER TABLE "recruitment"."job_questions" ADD CONSTRAINT "job_questions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "recruitment"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_questions_job_id_position_idx" ON "recruitment"."job_questions" USING btree ("job_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_slug_key" ON "recruitment"."jobs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "jobs_status_deadline_on_idx" ON "recruitment"."jobs" USING btree ("status","deadline_on");--> statement-breakpoint
CREATE INDEX "jobs_created_at_idx" ON "recruitment"."jobs" USING btree ("created_at");