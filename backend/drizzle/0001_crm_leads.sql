CREATE SCHEMA "crm";
--> statement-breakpoint
CREATE TABLE "crm"."leads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"submission_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"budget" text DEFAULT '' NOT NULL,
	"help_with" text NOT NULL,
	"project_type" text NOT NULL,
	"message" text NOT NULL,
	"source" text DEFAULT 'website-contact' NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	CONSTRAINT "leads_status_check" CHECK ("crm"."leads"."status" in ('new', 'contacted', 'qualified', 'won', 'lost'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "leads_submission_id_key" ON "crm"."leads" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "leads_status_created_at_idx" ON "crm"."leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "crm"."leads" USING btree ("created_at");