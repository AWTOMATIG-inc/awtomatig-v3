CREATE TABLE "hr"."employee_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"employee_id" uuid NOT NULL,
	"doc_type" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"expires_on" date,
	"note" text DEFAULT '' NOT NULL,
	CONSTRAINT "employee_documents_doc_type_check" CHECK ("hr"."employee_documents"."doc_type" in ('nid', 'passport', 'contract', 'certificate', 'cv', 'other')),
	CONSTRAINT "employee_documents_title_check" CHECK (char_length("hr"."employee_documents"."title") <= 100),
	CONSTRAINT "employee_documents_note_check" CHECK (char_length("hr"."employee_documents"."note") <= 300),
	CONSTRAINT "employee_documents_size_check" CHECK ("hr"."employee_documents"."size_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "hr"."employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employee_documents_storage_key_key" ON "hr"."employee_documents" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "employee_documents_employee_idx" ON "hr"."employee_documents" USING btree ("employee_id","created_at");--> statement-breakpoint
CREATE INDEX "employee_documents_expires_on_idx" ON "hr"."employee_documents" USING btree ("expires_on");