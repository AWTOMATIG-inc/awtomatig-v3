"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable, SortHeader } from "@/components/ui";
import type { components } from "@/lib/api/schema";
import { type LeadListParams, leadsHref, type LeadSort } from "@/lib/crm/leads";
import { formatDate } from "@/lib/format";

import { LeadStatusSelect } from "./LeadStatusSelect";

type Lead = components["schemas"]["LeadListDto"]["items"][number];

/** Where a click on a column title leads: that column sorted, or the opposite direction when it already is. */
function sortHref(params: LeadListParams, field: LeadSort): string {
  const active = params.sort === field;
  const order = active ? (params.order === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
  return leadsHref({ ...params, sort: field, order, page: 1 });
}

function Header({ label, field, params }: { label: string; field: LeadSort; params: LeadListParams }) {
  return <SortHeader label={label} href={sortHref(params, field)} active={params.sort === field} order={params.order} />;
}

/** The leads list in the shared table. Sorting, filtering and paging are links, so they happen on the server (root rules). */
export function LeadsTable({ leads, params, canUpdate }: { leads: readonly Lead[]; params: LeadListParams; canUpdate: boolean }) {
  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "name",
      header: () => <Header label="Name" field="name" params={params} />,
      cell: ({ row }) => (
        <Link
          href={`/crm/leads/${row.original.id}`}
          className="text-fg-strong ease-out-quint font-medium underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      // A mailto link: one click opens the team's mail app addressed to the lead.
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.email}`}
          className="ease-out-quint underline underline-offset-4 transition-colors duration-200 hover:no-underline motion-reduce:transition-none"
        >
          {row.original.email}
        </a>
      ),
    },
    { accessorKey: "company", header: "Company", cell: ({ getValue }) => (getValue() as string) || "-" },
    { accessorKey: "helpWith", header: "Interested in" },
    {
      accessorKey: "status",
      header: () => <Header label="Status" field="status" params={params} />,
      cell: ({ row }) => (
        <LeadStatusSelect id={row.original.id} name={row.original.name} status={row.original.status} canUpdate={canUpdate} />
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => <Header label="Received" field="createdAt" params={params} />,
      cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDate(getValue() as string)}</span>,
    },
  ];

  const filtered = Boolean(params.status ?? params.q);
  return (
    <DataTable
      columns={columns}
      data={leads}
      caption="Contact inquiries from the website"
      emptyMessage={
        filtered ? "No inquiries match these filters." : "No inquiries yet. New ones from the website contact form appear here."
      }
    />
  );
}
