CREATE TABLE "cms"."site_metrics" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "site_metrics_value_check" CHECK (char_length("cms"."site_metrics"."value") between 1 and 12)
);
