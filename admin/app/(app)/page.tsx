import type { Metadata } from "next";

import { ChartCard } from "@/components/charts/ChartCard";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader, SegmentedLinks, StatusBadge } from "@/components/ui";
import { getDashboard } from "@/lib/dashboard/data";
import { DASHBOARD_RANGES, parseRange, RANGE_LABELS } from "@/lib/dashboard/types";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * A worklist and a summary, not a status screen (DESIGN.md section 8). Every block comes from real data and links to where
 * the work happens; a block with nothing to show says so in one plain line. `?demo=1` shows labelled sample data, in
 * development only.
 */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string; demo?: string }> }) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const demo = params.demo === "1" && process.env.NODE_ENV === "development";
  const { kpis, chart, attention, activity } = await getDashboard(range, { demo });

  const rangeOptions = DASHBOARD_RANGES.map((value) => ({
    label: RANGE_LABELS[value],
    href: `/?range=${value}${demo ? "&demo=1" : ""}`,
    selected: value === range,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <>
            {demo && <StatusBadge tone="warning">Sample data</StatusBadge>}
            <SegmentedLinks label="Date range" options={rangeOptions} />
          </>
        }
      />

      <div className="flex flex-col gap-24">
        {kpis.length > 0 && (
          <ul className="grid grid-cols-1 gap-20 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <li key={kpi.id}>
                <KpiCard kpi={kpi} />
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-20 lg:grid-cols-3">
          {chart && <ChartCard chart={chart} unit="inquiries" className="lg:col-span-2" />}
          <AttentionCard items={attention} className={chart ? undefined : "lg:col-span-3"} />
        </div>

        <ActivityTable entries={activity} />
      </div>
    </>
  );
}
