"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable, SortHeader, StatusBadge } from "@/components/ui";
import { formatDate, formatNumber, formatPlainDate } from "@/lib/format";
import {
  JOB_STATE_LABEL,
  JOB_TYPE_LABEL,
  type JobListParams,
  jobHref,
  type JobSort,
  type JobSummary,
  jobsHref,
  jobState,
  jobStateTone,
  WORK_MODE_LABEL,
} from "@/lib/recruitment/jobs";

/** Where a click on a column title leads: that column sorted, or the opposite direction when it already is. */
function sortHref(params: JobListParams, field: JobSort): string {
  const active = params.sort === field;
  const order = active ? (params.order === "asc" ? "desc" : "asc") : field === "title" ? "asc" : "desc";
  return jobsHref({ ...params, sort: field, order, page: 1 });
}

function Header({ label, field, params }: { label: string; field: JobSort; params: JobListParams }) {
  return <SortHeader label={label} href={sortHref(params, field)} active={params.sort === field} order={params.order} />;
}

/** The job openings list in the shared table. Sorting, filtering and paging are links, so they happen on the server. */
export function JobsTable({ jobs, params }: { jobs: readonly JobSummary[]; params: JobListParams }) {
  const columns: ColumnDef<JobSummary>[] = [
    {
      accessorKey: "title",
      header: () => <Header label="Position" field="title" params={params} />,
      cell: ({ row }) => (
        <Link
          href={jobHref(row.original.id)}
          className="text-fg-strong ease-out-quint font-medium underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
        >
          {row.original.title}
        </Link>
      ),
    },
    { accessorKey: "jobType", header: "Type", cell: ({ row }) => JOB_TYPE_LABEL[row.original.jobType] },
    { accessorKey: "workMode", header: "Work mode", cell: ({ row }) => WORK_MODE_LABEL[row.original.workMode] },
    {
      accessorKey: "vacancies",
      header: "Vacancies",
      meta: { numeric: true },
      cell: ({ row }) => formatNumber(row.original.vacancies),
    },
    {
      accessorKey: "deadlineOn",
      header: () => <Header label="Deadline" field="deadlineOn" params={params} />,
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatPlainDate(row.original.deadlineOn)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const state = jobState(row.original);
        return <StatusBadge tone={jobStateTone(state)}>{JOB_STATE_LABEL[state]}</StatusBadge>;
      },
    },
    {
      accessorKey: "applicationCount",
      header: "Applications",
      meta: { numeric: true },
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatNumber(row.original.applicationCount)}
          {row.original.newApplicationCount > 0 && (
            <span className="text-fg-muted"> · {formatNumber(row.original.newApplicationCount)} new</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => <Header label="Created" field="createdAt" params={params} />,
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatDate(row.original.createdAt)}</span>,
    },
  ];

  const filtered = Boolean(params.status ?? params.q);
  return (
    <DataTable
      columns={columns}
      data={jobs}
      caption="Job openings"
      emptyMessage={
        filtered
          ? "No openings match these filters."
          : "No job openings yet. Create the first one to start receiving applications."
      }
    />
  );
}
