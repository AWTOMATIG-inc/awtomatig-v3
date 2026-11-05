import type { components } from "@/lib/api/schema";
import { WEBSITE_URL } from "@/lib/config";

export type SiteMetric = components["schemas"]["SiteMetricDto"];
export type SiteMetricPlacement = SiteMetric["placements"][number];

export const SITE_METRIC_GROUPS: readonly { kind: SiteMetric["kind"]; label: string }[] = [
  { kind: "stat", label: "Statistics" },
  { kind: "rating", label: "Ratings" },
];

/** The same formats as the backend (it repeats the checks); the dialog uses them for feedback while typing. */
const STAT_FORMAT = /^\d{1,5}(\+|%|k|k\+|M|M\+)?$/;
const RATING_FORMAT = /^([0-4](\.\d)?|5(\.0)?)$/;

/** A message when `value` is not a valid figure for this kind of slot, otherwise null. */
export function metricValueProblem(metric: Pick<SiteMetric, "kind" | "hint">, value: string): string | null {
  const text = value.trim();
  if (!text) return "Enter a value";
  return (metric.kind === "stat" ? STAT_FORMAT : RATING_FORMAT).test(text) ? null : metric.hint;
}

/** The pages that show a figure, each once, in the order they appear (the "Shown on" chips). */
export function metricPages(metric: Pick<SiteMetric, "placements">): string[] {
  return [...new Set(metric.placements.map((placement) => placement.page))];
}

/** A live page's address, for the "Open page" link. */
export const placementUrl = (placement: SiteMetricPlacement) => `${WEBSITE_URL}${placement.route === "/" ? "" : placement.route}`;
