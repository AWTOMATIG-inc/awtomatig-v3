CREATE TABLE "cms"."testimonials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort_order" integer NOT NULL,
	"published_at" timestamp with time zone,
	"quote" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"company" text NOT NULL,
	"service" text NOT NULL,
	"consent_confirmed" boolean DEFAULT false NOT NULL,
	"logo_in_black" boolean DEFAULT false NOT NULL,
	"logo_key" text,
	"logo_width" integer,
	"logo_height" integer,
	"logo_size" integer,
	"logo_type" text,
	CONSTRAINT "testimonials_status_check" CHECK ("cms"."testimonials"."status" in ('draft', 'published')),
	CONSTRAINT "testimonials_service_check" CHECK ("cms"."testimonials"."service" in ('website-infrastructure', 'back-office-operations', 'erp-business-systems', 'ad-tech')),
	CONSTRAINT "testimonials_quote_check" CHECK (char_length("cms"."testimonials"."quote") between 1 and 600),
	CONSTRAINT "testimonials_logo_check" CHECK (("cms"."testimonials"."logo_key" is null and "cms"."testimonials"."logo_width" is null and "cms"."testimonials"."logo_height" is null and "cms"."testimonials"."logo_size" is null and "cms"."testimonials"."logo_type" is null) or ("cms"."testimonials"."logo_key" is not null and "cms"."testimonials"."logo_width" is not null and "cms"."testimonials"."logo_height" is not null and "cms"."testimonials"."logo_size" is not null and "cms"."testimonials"."logo_type" is not null)),
	CONSTRAINT "testimonials_published_consent_check" CHECK ("cms"."testimonials"."status" <> 'published' or "cms"."testimonials"."consent_confirmed")
);
--> statement-breakpoint
CREATE INDEX "testimonials_status_sort_order_idx" ON "cms"."testimonials" USING btree ("status","sort_order");