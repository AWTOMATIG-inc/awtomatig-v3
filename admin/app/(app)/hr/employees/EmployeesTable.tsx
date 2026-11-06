"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable, SortHeader, StatusBadge } from "@/components/ui";
import { formatPlainDate } from "@/lib/format";
import {
  EMPLOYMENT_TYPE_LABEL,
  type EmployeeListParams,
  type EmployeeSort,
  type EmployeeSummary,
  employeeHref,
  employeesHref,
  formatPeriod,
  STATUS_LABEL,
  WORK_MODE_LABEL,
} from "@/lib/hr/employees";

/** Where a click on a column title leads: that column sorted, or the opposite direction when it already is. */
function sortHref(params: EmployeeListParams, field: EmployeeSort): string {
  const active = params.sort === field;
  const order = active ? (params.order === "asc" ? "desc" : "asc") : field === "joinedOn" ? "desc" : "asc";
  return employeesHref({ ...params, sort: field, order, page: 1 });
}

function Header({ label, field, params }: { label: string; field: EmployeeSort; params: EmployeeListParams }) {
  return <SortHeader label={label} href={sortHref(params, field)} active={params.sort === field} order={params.order} />;
}

/** The employees list in the shared table. Sorting, filtering and paging are links, so they happen on the server. */
export function EmployeesTable({
  employees,
  params,
  filtered,
}: {
  employees: readonly EmployeeSummary[];
  params: EmployeeListParams;
  filtered: boolean;
}) {
  const columns: ColumnDef<EmployeeSummary>[] = [
    {
      accessorKey: "employeeNo",
      header: () => <Header label="EMP ID" field="employeeNo" params={params} />,
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{row.original.employeeId}</span>,
    },
    {
      accessorKey: "fullName",
      header: () => <Header label="Name" field="fullName" params={params} />,
      cell: ({ row }) => (
        <div className="py-6">
          <Link
            href={employeeHref(row.original.id)}
            className="text-fg-strong ease-out-quint font-medium underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
          >
            {row.original.fullName}
          </Link>
          <p className="text-fg-muted">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "designation",
      header: () => <Header label="Designation" field="designation" params={params} />,
      cell: ({ row }) => row.original.designation,
    },
    { id: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "-" },
    {
      accessorKey: "employmentType",
      header: "Role type",
      cell: ({ row }) => <span className="whitespace-nowrap">{EMPLOYMENT_TYPE_LABEL[row.original.employmentType]}</span>,
    },
    { accessorKey: "workMode", header: "Work mode", cell: ({ row }) => WORK_MODE_LABEL[row.original.workMode] },
    {
      id: "manager",
      header: "Manager",
      cell: ({ row }) =>
        row.original.manager ? (
          <Link
            href={employeeHref(row.original.manager.id)}
            className="ease-out-quint underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
          >
            {row.original.manager.fullName}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "joinedOn",
      header: () => <Header label="Joined" field="joinedOn" params={params} />,
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatPlainDate(row.original.joinedOn)}</span>,
    },
    {
      id: "period",
      header: "Employment period",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.status === "upcoming" ? "-" : formatPeriod(row.original.period, { compact: true })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="inline-flex flex-col items-start gap-2">
          <StatusBadge>{STATUS_LABEL[row.original.status]}</StatusBadge>
          {row.original.leftOn && (
            <span className="type-caption-12 text-fg-muted whitespace-nowrap">
              {row.original.status === "left" ? "Left" : "Leaves"} {formatPlainDate(row.original.leftOn)}
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={employees}
      caption="Employees"
      emptyMessage={
        filtered ? "No employees match these filters." : "No employees yet. Add the first one to start their career timeline."
      }
    />
  );
}
