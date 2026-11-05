import { Card, CardHeader } from "@/components/ui";
import type { AnalyticsRow } from "@/lib/analytics/types";
import { formatNumber } from "@/lib/format";

/** A short ranked list (top pages, channels, countries) as a real table inside a card. Server-rendered; no interaction. */
export function RankTable({
  title,
  subtitle,
  nameHeader,
  primaryHeader,
  secondaryHeader,
  rows,
  className,
}: {
  title: string;
  subtitle: string;
  nameHeader: string;
  primaryHeader: string;
  secondaryHeader: string;
  rows: readonly AnalyticsRow[];
  className?: string;
}) {
  const id = `rank-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <Card className={className} aria-labelledby={id}>
      <CardHeader id={id} title={title} subtitle={subtitle} />
      {rows.length === 0 ? (
        <p className="type-body-16 text-fg-muted p-20">No data for this period.</p>
      ) : (
        <div className="mt-16 overflow-x-auto">
          <table className="type-body-14 w-full">
            <thead>
              <tr className="bg-surface-subtle type-caption-12 text-fg-muted h-40 uppercase">
                <th scope="col" className="px-20 text-left font-normal">
                  {nameHeader}
                </th>
                <th scope="col" className="px-12 text-right font-normal">
                  {primaryHeader}
                </th>
                <th scope="col" className="px-20 text-right font-normal">
                  {secondaryHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-border h-48 border-t">
                  <th scope="row" className="text-fg-primary max-w-0 truncate px-20 text-left font-medium" title={row.name}>
                    {row.name}
                  </th>
                  <td className="px-12 text-right tabular-nums">{formatNumber(row.primary)}</td>
                  <td className="px-20 text-right tabular-nums">{formatNumber(row.secondary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
