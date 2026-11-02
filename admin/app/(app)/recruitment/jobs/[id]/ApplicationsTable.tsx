"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable, SortHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  applicationHref,
  type ApplicationListParams,
  type ApplicationSort,
  type ApplicationSummary,
  applicationsHref,
} from "@/lib/recruitment/applications";

import { ApplicationStatusSelect } from "./ApplicationStatusSelect";

/** Where a click on a column title leads: that column sorted, or the opposite direction when it already is. */
function sortHref(jobId: string, params: ApplicationListParams, field: ApplicationSort): string {
  const active = params.sort === field;
  const order = active ? (params.order === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
  return applicationsHref(jobId, { ...params, sort: field, order, page: 1 });
}

/** One opening's applications in the shared table. Sorting, filtering and paging are links, so they happen on the server. */
export function ApplicationsTable({
  jobId,
  applications,
  params,
  canUpdate,
}: {
  jobId: string;
  applications: readonly ApplicationSummary[];
  params: ApplicationListParams;
  canUpdate: boolean;
}) {
  const header = (label: string, field: ApplicationSort) => (
    <SortHeader label={label} href={sortHref(jobId, params, field)} active={params.sort === field} order={params.order} />
  );

  const columns: ColumnDef<ApplicationSummary>[] = [
    {
      accessorKey: "fullName",
      header: () => header("Name", "fullName"),
      cell: ({ row }) => (
        <Link
          href={applicationHref(jobId, row.original.id)}
          className="text-fg-strong ease-out-quint font-medium underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
        >
          {row.original.fullName}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      // A mailto link: one click opens the team's mail app addressed to the candidate.
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.email}`}
          className="ease-out-quint underline underline-offset-4 transition-colors duration-200 hover:no-underline motion-reduce:transition-none"
        >
          {row.original.email}
        </a>
      ),
    },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.phone}</span> },
    {
      accessorKey: "status",
      header: () => header("Status", "status"),
      cell: ({ row }) => (
        <ApplicationStatusSelect
          id={row.original.id}
          name={row.original.fullName}
          status={row.original.status}
          canUpdate={canUpdate}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => header("Applied", "createdAt"),
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatDate(row.original.createdAt)}</span>,
    },
  ];

  const filtered = Boolean(params.status ?? params.q);
  return (
    <DataTable
      columns={columns}
      data={applications}
      caption="Applications for this opening"
      emptyMessage={
        filtered ? "No applications match these filters." : "No applications yet. They appear here as candidates apply."
      }
    />
  );
}
