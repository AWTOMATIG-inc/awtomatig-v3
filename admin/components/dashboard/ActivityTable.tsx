"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardHeader, DataTable } from "@/components/ui";
import type { ActivityEntry } from "@/lib/dashboard/types";
import { formatDateTime } from "@/lib/format";

const COLUMNS: ColumnDef<ActivityEntry>[] = [
  {
    accessorKey: "at",
    header: "When",
    cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDateTime(getValue() as string)}</span>,
  },
  { accessorKey: "actor", header: "Who" },
  { accessorKey: "action", header: "What" },
];

/** The latest entries from the audit log, in the shared data table. */
export function ActivityTable({ entries }: { entries: readonly ActivityEntry[] }) {
  return (
    <Card aria-labelledby="activity-title">
      <CardHeader id="activity-title" title="Recent activity" />
      <div className="border-border mt-16 border-t">
        <DataTable columns={COLUMNS} data={entries.slice(0, 8)} caption="Recent activity" emptyMessage="No recent activity." />
      </div>
    </Card>
  );
}
