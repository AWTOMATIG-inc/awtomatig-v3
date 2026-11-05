import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { SITE_METRIC_KEYS, updateSiteMetricSchema } from "../domain/site-metric";

const iso = z.iso.datetime();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);

const placement = z.object({ page: z.string(), route: z.string(), section: z.string() });

const siteMetric = z.object({
  key: z.enum(SITE_METRIC_KEYS as [string, ...string[]]),
  /** The field title. */
  title: z.string(),
  kind: z.enum(["stat", "rating"]),
  /** What a valid value looks like, for the form. */
  hint: z.string(),
  /** Every page and section that shows this figure. */
  placements: z.array(placement),
  value: z.string(),
  /** What the website shows until the figure is edited. */
  defaultValue: z.string(),
  /** Null until an employee edits the figure (a seeded value counts as never edited). */
  updatedAt: orNull(iso),
  updatedBy: orNull(z.uuid()),
});

export class SiteMetricKeyParamsDto extends createZodDto(z.object({ key: z.enum(SITE_METRIC_KEYS as [string, ...string[]]) })) {}
export class UpdateSiteMetricDto extends createZodDto(updateSiteMetricSchema) {}
export class SiteMetricDto extends createZodDto(siteMetric) {}
export class SiteMetricListDto extends createZodDto(z.object({ items: z.array(siteMetric) })) {}
/** The website's view: a flat map of key to value. */
export class PublicSiteMetricsDto extends createZodDto(z.object({ values: z.record(z.string(), z.string()) })) {}
