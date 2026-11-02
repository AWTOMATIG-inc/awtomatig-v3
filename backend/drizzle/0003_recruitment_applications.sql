CREATE TABLE "recruitment"."application_answers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"application_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"question_text" text NOT NULL,
	"answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment"."application_educations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"application_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"degree" text NOT NULL,
	"field_of_study" text NOT NULL,
	"institution" text NOT NULL,
	"completed_on" date,
	"ongoing" boolean DEFAULT false NOT NULL,
	"grade" text,
	CONSTRAINT "application_educations_done_or_ongoing_check" CHECK (("recruitment"."application_educations"."completed_on" is not null) <> "recruitment"."application_educations"."ongoing")
);
--> statement-breakpoint
CREATE TABLE "recruitment"."application_experiences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"application_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"company" text NOT NULL,
	"title" text NOT NULL,
	"from_on" date NOT NULL,
	"to_on" date,
	"current" boolean DEFAULT false NOT NULL,
	"responsibilities" text NOT NULL,
	CONSTRAINT "application_experiences_end_or_current_check" CHECK (("recruitment"."application_experiences"."to_on" is not null) <> "recruitment"."application_experiences"."current"),
	CONSTRAINT "application_experiences_range_check" CHECK ("recruitment"."application_experiences"."to_on" is null or "recruitment"."application_experiences"."to_on" >= "recruitment"."application_experiences"."from_on")
);
--> statement-breakpoint
CREATE TABLE "recruitment"."applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"job_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"email_normalized" text NOT NULL,
	"phone_normalized" text NOT NULL,
	"github_url" text,
	"linkedin_url" text,
	"resume_key" text NOT NULL,
	"resume_name" text NOT NULL,
	"resume_size" integer NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"consented_at" timestamp with time zone NOT NULL,
	CONSTRAINT "applications_status_check" CHECK ("recruitment"."applications"."status" in ('new', 'shortlisted', 'interview', 'hired', 'rejected')),
	CONSTRAINT "applications_resume_size_check" CHECK ("recruitment"."applications"."resume_size" > 0)
);
--> statement-breakpoint
ALTER TABLE "recruitment"."application_answers" ADD CONSTRAINT "application_answers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "recruitment"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment"."application_answers" ADD CONSTRAINT "application_answers_question_id_job_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "recruitment"."job_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment"."application_educations" ADD CONSTRAINT "application_educations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "recruitment"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment"."application_experiences" ADD CONSTRAINT "application_experiences_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "recruitment"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment"."applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "recruitment"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_answers_application_question_key" ON "recruitment"."application_answers" USING btree ("application_id","question_id");--> statement-breakpoint
CREATE INDEX "application_answers_application_id_idx" ON "recruitment"."application_answers" USING btree ("application_id","position");--> statement-breakpoint
CREATE INDEX "application_educations_application_id_idx" ON "recruitment"."application_educations" USING btree ("application_id","position");--> statement-breakpoint
CREATE INDEX "application_experiences_application_id_idx" ON "recruitment"."application_experiences" USING btree ("application_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_submission_id_key" ON "recruitment"."applications" USING btree ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_job_email_key" ON "recruitment"."applications" USING btree ("job_id","email_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_job_phone_key" ON "recruitment"."applications" USING btree ("job_id","phone_normalized");--> statement-breakpoint
CREATE INDEX "applications_job_status_created_at_idx" ON "recruitment"."applications" USING btree ("job_id","status","created_at");