import { formatNumber } from "@/lib/format";

import type { AnalyticsMetric } from "./types";

/** `1m 23s`, `45s` */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, "0")}s`;
}

/** `62.4%`, from GA's 0..1 rate. */
export function formatPercent(rate: number): string {
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(rate * 100)}%`;
}

export function formatMetric(metric: AnalyticsMetric): string {
  if (metric.id === "engagementRate") return formatPercent(metric.current);
  if (metric.id === "avgSessionDuration") return formatDuration(metric.current);
  return formatNumber(metric.current);
}

/**
 * The change against the previous period as plain text, or null when there is nothing real to compare (no data before).
 * Rates are compared in percentage points, everything else in percent.
 */
export function describeChange(metric: AnalyticsMetric, periodLabel: string): string | null {
  const { current, previous } = metric;
  if (metric.id === "engagementRate") {
    if (previous === 0 && current === 0) return null;
    const points = (current - previous) * 100;
    const sign = points > 0 ? "+" : points < 0 ? "-" : "";
    return `${sign}${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(Math.abs(points))} pts vs previous ${periodLabel}`;
  }
  if (previous === 0) return null;
  const percent = ((current - previous) / previous) * 100;
  const sign = percent > 0 ? "+" : percent < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(Math.abs(percent))}% vs previous ${periodLabel}`;
}
