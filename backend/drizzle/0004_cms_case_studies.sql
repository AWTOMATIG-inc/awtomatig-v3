CREATE SCHEMA "cms";
--> statement-breakpoint
CREATE TABLE "cms"."case_studies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort_order" integer NOT NULL,
	"published_at" timestamp with time zone,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"client" text NOT NULL,
	"service" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"challenge" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"stats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seo_title" text DEFAULT '' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"image_key" text,
	"image_alt" text,
	"image_width" integer,
	"image_height" integer,
	"image_size" integer,
	"image_type" text,
	CONSTRAINT "case_studies_status_check" CHECK ("cms"."case_studies"."status" in ('draft', 'published')),
	CONSTRAINT "case_studies_service_check" CHECK ("cms"."case_studies"."service" in ('website-infrastructure', 'back-office-operations', 'erp-business-systems', 'ad-tech')),
	CONSTRAINT "case_studies_category_check" CHECK ("cms"."case_studies"."category" in ('website-infrastructure', 'back-office-operations', 'erp-business-systems', 'ad-tech')),
	CONSTRAINT "case_studies_stats_check" CHECK (jsonb_typeof("cms"."case_studies"."stats") = 'array' and jsonb_array_length("cms"."case_studies"."stats") in (0, 4)),
	CONSTRAINT "case_studies_published_image_check" CHECK ("cms"."case_studies"."status" <> 'published' or ("cms"."case_studies"."image_key" is not null and "cms"."case_studies"."image_alt" is not null and "cms"."case_studies"."image_width" is not null and "cms"."case_studies"."image_height" is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "case_studies_slug_key" ON "cms"."case_studies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "case_studies_status_sort_order_idx" ON "cms"."case_studies" USING btree ("status","sort_order");