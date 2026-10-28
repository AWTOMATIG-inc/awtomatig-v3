"use client";

import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ChartPoint } from "@/lib/dashboard/types";
import { formatNumber } from "@/lib/format";

// Recharts takes colors as strings, so these are the token variables (never hex): charcoal for the series, cyan for the one
// bar that is the point (DESIGN.md section 7.9).
const SERIES = "var(--color-charcoal)";
const HIGHLIGHT = "var(--color-action-primary)";
const AXIS_TEXT = { fill: "var(--color-fg-muted)", fontSize: 12 };

/**
 * A bar chart in the admin style: horizontal hairline gridlines only, no axis lines, 2px top radius, charcoal bars with
 * one cyan highlight, no gradients. Wrap it in a `Card`; `ChartCard` also adds the screen-reader table.
 */
export function BarChart({ points, unit }: { points: readonly ChartPoint[]; unit: string }) {
  return (
    <div className="h-240 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={points as ChartPoint[]} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TEXT} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS_TEXT} width={32} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--color-surface-subtle)" }}
            isAnimationActive={false}
            content={({ active, payload, label }) =>
              active && payload?.[0] ? (
                <div className="type-body-14 rounded-8 border-border bg-surface shadow-card border px-12 py-8">
                  <p className="text-fg-muted">{String(label)}</p>
                  <p className="text-fg-strong tabular-nums">
                    {formatNumber(Number(payload[0].value))} {unit}
                  </p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={32} isAnimationActive={false}>
            {points.map((point) => (
              <Cell key={point.label} fill={point.highlight ? HIGHLIGHT : SERIES} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
