CREATE TABLE "cms"."faqs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort_order" integer NOT NULL,
	"published_at" timestamp with time zone,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	CONSTRAINT "faqs_status_check" CHECK ("cms"."faqs"."status" in ('draft', 'published')),
	CONSTRAINT "faqs_question_check" CHECK (char_length("cms"."faqs"."question") between 1 and 200),
	CONSTRAINT "faqs_answer_check" CHECK (char_length("cms"."faqs"."answer") between 1 and 1000)
);
--> statement-breakpoint
CREATE INDEX "faqs_status_sort_order_idx" ON "cms"."faqs" USING btree ("status","sort_order");