import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgSchema, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { authorColumns, baseColumns } from "../../shared/db/columns";

/** The cms module's own Postgres schema. Only this module's repo reads or writes these tables. */
export const cmsSchema = pgSchema("cms");

/**
 * A case study shown on the website (Home, Case Studies page). It has one showcase image in the public bucket, kept as a key plus
 * metadata: the bytes are never in Postgres. The `service` and `category` values are the website's four service ids.
 */
export const caseStudies = cmsSchema.table(
  "case_studies",
  {
    ...baseColumns,
    ...authorColumns,
    /** Fixed at creation: it is the URL (`/case-studies/<slug>`) and the image folder (`case-study/<slug>/`). */
    slug: text("slug").notNull(),
    status: text("status").notNull().default("draft"),
    /** Position on the website, lowest first. */
    sortOrder: integer("sort_order").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    client: text("client").notNull(),
    service: text("service").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    challenge: text("challenge").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** An array of four `{ value, label }`, or empty. Shape checked by zod in the domain, count checked here. */
    stats: jsonb("stats")
      .$type<{ value: string; label: string }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    /** Object key in the public bucket, for example `case-study/royal-safari-tours/image1.png`. Null until an image is uploaded. */
    imageKey: text("image_key"),
    imageAlt: text("image_alt"),
    imageWidth: integer("image_width"),
    imageHeight: integer("image_height"),
    imageSize: integer("image_size"),
    imageType: text("image_type"),
  },
  (table) => [
    uniqueIndex("case_studies_slug_key").on(table.slug),
    index("case_studies_status_sort_order_idx").on(table.status, table.sortOrder),
    check("case_studies_status_check", sql`${table.status} in ('draft', 'published')`),
    check(
      "case_studies_service_check",
      sql`${table.service} in ('website-infrastructure', 'back-office-operations', 'erp-business-systems', 'ad-tech')`,
    ),
    check(
      "case_studies_category_check",
      sql`${table.category} in ('website-infrastructure', 'back-office-operations', 'erp-business-systems', 'ad-tech')`,
    ),
    check(
      "case_studies_stats_check",
      sql`jsonb_typeof(${table.stats}) = 'array' and jsonb_array_length(${table.stats}) in (0, 4)`,
    ),
    // A published study always has a complete image: the public site must never render a broken card.
    check(
      "case_studies_published_image_check",
      sql`${table.status} <> 'published' or (${table.imageKey} is not null and ${table.imageAlt} is not null and ${table.imageWidth} is not null and ${table.imageHeight} is not null)`,
    ),
  ],
);
