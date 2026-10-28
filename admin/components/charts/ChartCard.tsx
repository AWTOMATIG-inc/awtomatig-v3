import { Card, CardHeader } from "@/components/ui";
import type { ChartData } from "@/lib/dashboard/types";

import { BarChart } from "./BarChart";

/** A titled card around a chart, with the unit and period in the subtitle and the same numbers as a table for screen readers. */
export function ChartCard({ chart, unit, className }: { chart: ChartData; unit: string; className?: string }) {
  return (
    <Card className={className} aria-labelledby="chart-title">
      <CardHeader id="chart-title" title={chart.title} subtitle={chart.subtitle} />
      <div className="p-20" role="img" aria-label={`${chart.title}. ${chart.subtitle}. The values follow in a table.`}>
        <BarChart points={chart.points} unit={unit} />
      </div>
      <table className="sr-only">
        <caption>{chart.title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {chart.points.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
