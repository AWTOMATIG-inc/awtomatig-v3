"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { Fragment, useState } from "react";

import { Button, DataTable } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { metricPages, SITE_METRIC_GROUPS, type SiteMetric } from "@/lib/cms/site-metrics";

import { SiteMetricDialog } from "./SiteMetricDialog";

/** Two small tables, Statistics and Ratings. Each row: the field title, its value, the pages that show it, when it last changed. */
export function SiteMetricsTable({ metrics, canUpdate }: { metrics: readonly SiteMetric[]; canUpdate: boolean }) {
  const [editing, setEditing] = useState<SiteMetric | null>(null);

  const columns: ColumnDef<SiteMetric>[] = [
    {
      id: "field",
      header: "Field",
      cell: ({ row }) => <span className="text-fg-strong min-w-160 font-medium">{row.original.title}</span>,
    },
    {
      id: "value",
      header: "Value",
      cell: ({ row }) => <span className="text-fg-strong font-medium tabular-nums">{row.original.value}</span>,
    },
    {
      id: "pages",
      header: "Shown on",
      cell: ({ row }) => (
        <ul className="flex min-w-200 flex-wrap gap-6">
          {metricPages(row.original).map((page) => (
            <li key={page} className="type-caption-12 rounded-6 bg-surface-subtle text-fg-primary px-8 py-2 whitespace-nowrap">
              {page}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "updated",
      header: "Last updated",
      cell: ({ row }) =>
        row.original.updatedAt ? (
          <span className="whitespace-nowrap">{formatDateTime(row.original.updatedAt)}</span>
        ) : (
          <span className="type-caption-12 text-fg-muted">Not edited yet</span>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) =>
        canUpdate ? (
          <div className="flex justify-end">
            <Button
              size="sm"
              icon={<Pencil strokeWidth={1.5} />}
              aria-label={`Edit ${row.original.title}`}
              onClick={() => setEditing(row.original)}
            >
              Edit
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      {SITE_METRIC_GROUPS.map((group, index) => {
        const rows = metrics.filter((metric) => metric.kind === group.kind);
        if (rows.length === 0) return null;
        return (
          <Fragment key={group.kind}>
            <h2 className={`type-heading-20 px-16 pt-16 pb-8 ${index > 0 ? "border-border border-t" : ""}`}>{group.label}</h2>
            <DataTable columns={columns} data={rows} caption={group.label} emptyMessage="Nothing to show." />
          </Fragment>
        );
      })}

      <SiteMetricDialog metric={editing} onClose={() => setEditing(null)} />
    </>
  );
}
