import type { DashboardRange } from "@/lib/dashboard/types";

/** One headline figure for the selected period and the same-length period before it, so a change is shown only when it is real. */
export interface AnalyticsMetric {
  id: "activeUsers" | "newUsers" | "sessions" | "pageViews" | "engagementRate" | "avgSessionDuration";
  label: string;
  /** Raw numbers: a rate is 0..1, a duration is seconds. Formatting is the screen's job. */
  current: number;
  previous: number;
}

export interface AnalyticsRow {
  /** The page path, channel or country. */
  name: string;
  primary: number;
  secondary: number;
}

export interface AnalyticsTrendPoint {
  /** `YYYY-MM-DD` */
  date: string;
  sessions: number;
}

export interface AnalyticsReport {
  range: DashboardRange;
  /** `YYYY-MM-DD` first and last day of the selected period, in the property's reporting time zone. */
  from: string;
  to: string;
  metrics: readonly AnalyticsMetric[];
  trend: readonly AnalyticsTrendPoint[];
  pages: readonly AnalyticsRow[];
  channels: readonly AnalyticsRow[];
  countries: readonly AnalyticsRow[];
  /** ISO time the data was fetched from Google (results are cached for a few minutes). */
  fetchedAt: string;
}

export type AnalyticsResult =
  | { status: "ok"; report: AnalyticsReport }
  | { status: "not-configured"; missing: readonly string[] }
  | { status: "error"; message: string };
