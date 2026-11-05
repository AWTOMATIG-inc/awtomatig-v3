import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

import { APP_TIMEZONE } from "@/lib/config";
import type { DashboardRange } from "@/lib/dashboard/types";

import type { AnalyticsMetric, AnalyticsReport, AnalyticsResult, AnalyticsRow } from "./types";

/**
 * Google Analytics 4 through Google's Data API client. Server only: the service-account key never reaches the browser, and
 * the page that calls this is behind the admin session. Read-only reporting; nothing is written to GA.
 *
 * Environment (admin/.env): GA_PROPERTY_ID (the numeric id), GA_CLIENT_EMAIL and GA_PRIVATE_KEY of a service account that has
 * been added to the property as a Viewer. GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY are accepted as alternative names.
 * GA_MEASUREMENT_ID (the `G-...` tag id) belongs to the website's tag; reporting does not use it.
 */

const RANGE_DAYS: Record<DashboardRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
const CACHE_MS = 5 * 60 * 1000;
const TOP_ROWS = 10;

interface GaConfig {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
}

function readConfig(): GaConfig | { missing: string[] } {
  const propertyId = process.env.GA_PROPERTY_ID?.trim();
  const clientEmail = (process.env.GA_CLIENT_EMAIL ?? process.env.GOOGLE_CLIENT_EMAIL)?.trim();
  // A key kept on one line in an env file has literal "\n" sequences; a multi-line quoted value already has real newlines.
  const privateKey = (process.env.GA_PRIVATE_KEY ?? process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, "\n").trim();

  const missing: string[] = [];
  if (!propertyId) missing.push("GA_PROPERTY_ID");
  if (!clientEmail) missing.push("GA_CLIENT_EMAIL");
  if (!privateKey) missing.push("GA_PRIVATE_KEY");
  if (!propertyId || !clientEmail || !privateKey) return { missing };
  // The property id is the number in Analytics > Admin > Property details, not the `G-...` measurement id.
  return { propertyId: propertyId.replace(/^properties\//, ""), clientEmail, privateKey };
}

let client: { key: string; instance: BetaAnalyticsDataClient } | null = null;

function getClient(config: GaConfig): BetaAnalyticsDataClient {
  const key = `${config.clientEmail}:${config.privateKey.length}`;
  if (!client || client.key !== key) {
    client = {
      key,
      instance: new BetaAnalyticsDataClient({
        credentials: { client_email: config.clientEmail, private_key: config.privateKey },
      }),
    };
  }
  return client.instance;
}

const cache = new Map<DashboardRange, { at: number; report: AnalyticsReport }>();

/** The analytics report for the range, cached five minutes per range (GA data is not real time and the API has quotas). */
export async function getAnalytics(range: DashboardRange): Promise<AnalyticsResult> {
  const config = readConfig();
  if ("missing" in config) return { status: "not-configured", missing: config.missing };

  const hit = cache.get(range);
  if (hit && Date.now() - hit.at < CACHE_MS) return { status: "ok", report: hit.report };

  try {
    const report = await fetchReport(config, range);
    cache.set(range, { at: Date.now(), report });
    return { status: "ok", report };
  } catch (error) {
    // Log the cause for the operator, never the credentials. Google's message names it (permission, wrong id, API off).
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[analytics] Google Analytics request failed:", detail);
    if (hit) return { status: "ok", report: hit.report }; // the last good data beats an error screen
    return { status: "error", message: explain(detail) };
  }
}

/** Turns Google's error into a sentence an administrator can act on, without echoing anything sensitive. */
function explain(detail: string): string {
  if (/has not been used|SERVICE_DISABLED|API has not been enabled/i.test(detail)) {
    return "The Google Analytics Data API is not enabled for the service account's Google Cloud project.";
  }
  if (/PERMISSION_DENIED|sufficient permissions|403/i.test(detail)) {
    return "Google refused the request. Add the service account's email to the Google Analytics property as a Viewer.";
  }
  if (/invalid_grant|DECODER|PEM|private key|invalid_client|UNAUTHENTICATED|401/i.test(detail)) {
    return "Google could not sign in with the service account. Check GA_CLIENT_EMAIL and GA_PRIVATE_KEY.";
  }
  if (/NOT_FOUND|404|property/i.test(detail)) return "Google could not find the property. Check GA_PROPERTY_ID.";
  if (/RESOURCE_EXHAUSTED|quota|429/i.test(detail))
    return "Google Analytics is rate limiting requests. Try again in a few minutes.";
  return "Google Analytics could not be reached. Try again in a moment.";
}

const num = (value: string | null | undefined) => Number(value ?? 0) || 0;

async function fetchReport(config: GaConfig, range: DashboardRange): Promise<AnalyticsReport> {
  const days = RANGE_DAYS[range];
  const current = { startDate: `${days - 1}daysAgo`, endDate: "today", name: "current" };
  const previous = { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo`, name: "previous" };
  const dateRanges = [current];

  const [response] = await getClient(config).batchRunReports({
    property: `properties/${config.propertyId}`,
    requests: [
      {
        dateRanges: [current, previous],
        metrics: [
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "averageSessionDuration" },
        ],
      },
      {
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
      {
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: TOP_ROWS,
      },
      {
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: TOP_ROWS,
      },
      {
        dateRanges,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: TOP_ROWS,
      },
    ],
  });

  const [summary, trend, pages, channels, countries] = response.reports ?? [];

  // With two date ranges GA adds a `dateRange` dimension to each row; rows are matched by that name.
  const summaryRow = (name: string) =>
    summary?.rows?.find((row) => row.dimensionValues?.some((d) => d.value === name))?.metricValues ?? [];
  const now = summaryRow("current");
  const before = summaryRow("previous");
  const metric = (index: number, id: AnalyticsMetric["id"], label: string): AnalyticsMetric => ({
    id,
    label,
    current: num(now[index]?.value),
    previous: num(before[index]?.value),
  });

  const rows = (report: typeof pages): AnalyticsRow[] =>
    (report?.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || "(not set)",
      primary: num(row.metricValues?.[0]?.value),
      secondary: num(row.metricValues?.[1]?.value),
    }));

  // GA leaves out days with no traffic, so every day of the period is listed here and the quiet ones show as zero.
  const bySession = new Map<string, number>();
  for (const row of trend?.rows ?? []) {
    const d = row.dimensionValues?.[0]?.value ?? "";
    bySession.set(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, num(row.metricValues?.[0]?.value));
  }
  const trendPoints = lastDays(days).map((date) => ({ date, sessions: bySession.get(date) ?? 0 }));

  return {
    range,
    from: trendPoints[0]?.date ?? "",
    to: trendPoints[trendPoints.length - 1]?.date ?? "",
    metrics: [
      metric(0, "activeUsers", "Users"),
      metric(1, "newUsers", "New users"),
      metric(2, "sessions", "Sessions"),
      metric(3, "pageViews", "Page views"),
      metric(4, "engagementRate", "Engagement rate"),
      metric(5, "avgSessionDuration", "Avg. session duration"),
    ],
    trend: trendPoints,
    pages: rows(pages),
    channels: rows(channels),
    countries: rows(countries),
    fetchedAt: new Date().toISOString(),
  };
}

/** The last `days` calendar days up to today in the app's time zone, oldest first, as `YYYY-MM-DD`. */
function lastDays(days: number): string[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date()); // en-CA prints YYYY-MM-DD
  const end = Date.parse(`${today}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}
