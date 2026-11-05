import type { Metadata } from "next";

import { ChartCard } from "@/components/charts/ChartCard";
import { Button, Card, EmptyState, PageHeader, SegmentedLinks } from "@/components/ui";
import { describeChange, formatMetric } from "@/lib/analytics/format";
import { getAnalytics } from "@/lib/analytics/ga";
import { requireSession } from "@/lib/auth/session";
import { DASHBOARD_RANGES, parseRange, RANGE_LABELS } from "@/lib/dashboard/types";
import { formatDateTime, formatDayMonth } from "@/lib/format";

import { RankTable } from "./RankTable";

export const metadata: Metadata = { title: "Google Analytics" };

/**
 * Website traffic from Google Analytics 4, read on the server with the service account in admin/.env. The range is in the URL
 * (`?range=30d`) like the dashboard. Results are cached for five minutes, so this page does not spend Google's quota on every view.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireSession();
  const range = parseRange((await searchParams).range);
  const result = await getAnalytics(range);

  const rangeOptions = DASHBOARD_RANGES.map((value) => ({
    label: RANGE_LABELS[value],
    href: `/analytics/google?range=${value}`,
    selected: value === range,
  }));
  const header = (
    <PageHeader
      title="Google Analytics"
      description="Website traffic from Google Analytics. Data can be several hours behind."
      actions={<SegmentedLinks label="Date range" options={rangeOptions} />}
    />
  );

  if (result.status === "not-configured") {
    return (
      <>
        {header}
        <Card>
          <EmptyState>
            Google Analytics is not set up on this server. Add {result.missing.join(", ")} to admin/.env and restart the admin.
          </EmptyState>
        </Card>
      </>
    );
  }

  if (result.status === "error") {
    return (
      <>
        {header}
        <Card>
          <EmptyState action={<Button href={`/analytics/google?range=${range}`}>Try again</Button>}>{result.message}</EmptyState>
        </Card>
      </>
    );
  }

  const { report } = result;
  const period = RANGE_LABELS[range];
  const lastIndex = report.trend.length - 1;

  return (
    <>
      {header}
      <div className="flex flex-col gap-24">
        <ul className="grid grid-cols-1 gap-20 sm:grid-cols-2 xl:grid-cols-3">
          {report.metrics.map((metric) => {
            const change = describeChange(metric, period);
            return (
              <li key={metric.id} className="rounded-12 border-border bg-surface border p-20">
                <p className="type-caption-12 text-fg-muted uppercase">{metric.label}</p>
                <p className="type-heading-40 text-fg-strong mt-8 font-normal tabular-nums">{formatMetric(metric)}</p>
                <p className="type-body-14 text-fg-muted mt-4">{change ?? `Last ${period}`}</p>
              </li>
            );
          })}
        </ul>

        {report.trend.length > 0 ? (
          <ChartCard
            unit="sessions"
            chart={{
              title: "Sessions per day",
              subtitle: `${formatDayMonth(report.from)} to ${formatDayMonth(report.to)}, last ${period}`,
              points: report.trend.map((point, index) => ({
                label: formatDayMonth(point.date),
                value: point.sessions,
                highlight: index === lastIndex,
              })),
            }}
          />
        ) : (
          <Card>
            <EmptyState>No sessions were recorded in the last {period}.</EmptyState>
          </Card>
        )}

        <RankTable
          title="Top pages"
          subtitle={`By page views, last ${period}`}
          nameHeader="Page"
          primaryHeader="Views"
          secondaryHeader="Users"
          rows={report.pages}
        />

        <div className="grid gap-20 lg:grid-cols-2">
          <RankTable
            title="Traffic sources"
            subtitle={`Sessions by channel, last ${period}`}
            nameHeader="Channel"
            primaryHeader="Sessions"
            secondaryHeader="Users"
            rows={report.channels}
          />
          <RankTable
            title="Countries"
            subtitle={`Users by country, last ${period}`}
            nameHeader="Country"
            primaryHeader="Users"
            secondaryHeader="Sessions"
            rows={report.countries}
          />
        </div>

        <p className="type-body-14 text-fg-muted">Fetched from Google Analytics {formatDateTime(report.fetchedAt)}.</p>
      </div>
    </>
  );
}
