export const DASHBOARD_RANGES = ["7d", "30d", "90d"] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export const RANGE_LABELS: Record<DashboardRange, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" };

export function parseRange(value: string | string[] | undefined): DashboardRange {
  return DASHBOARD_RANGES.find((range) => range === value) ?? "30d";
}

/** A count or amount that links to the list it counts. `context` is plain text; a trend appears only when it is real. */
export interface Kpi {
  id: string;
  label: string;
  value: string;
  context?: string;
  href: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  /** The one point that matters (usually the current period). Drawn in cyan. */
  highlight?: boolean;
}

export interface ChartData {
  title: string;
  /** Always states the unit and the period. */
  subtitle: string;
  points: readonly ChartPoint[];
}

export type AttentionTone = "error" | "caution" | "neutral";

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  tone: AttentionTone;
  href: string;
}

export interface ActivityEntry {
  id: string;
  /** ISO 8601 */
  at: string;
  actor: string;
  action: string;
}

export interface DashboardData {
  kpis: readonly Kpi[];
  chart: ChartData | null;
  attention: readonly AttentionItem[];
  activity: readonly ActivityEntry[];
}
