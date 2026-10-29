"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

import { DataTable } from "@/components/ui";
import type { components } from "@/lib/api/schema";
import { type LeadListParams, leadsHref, type LeadSort } from "@/lib/crm/leads";
import { formatDate } from "@/lib/format";

import { LeadStatusSelect } from "./LeadStatusSelect";

type Lead = components["schemas"]["LeadListDto"]["items"][number];

/** A column title that sorts the list: the first click sorts by it, the next one flips the direction. */
function SortHeader({ label, field, params }: { label: string; field: LeadSort; params: LeadListParams }) {
  const active = params.sort === field;
  const nextOrder = active && params.order === "asc" ? "desc" : "asc";
  const Icon = params.order === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={leadsHref({ ...params, sort: field, order: active ? nextOrder : field === "createdAt" ? "desc" : "asc", page: 1 })}
      aria-label={`Sort by ${label}`}
      className="ease-out-quint hover:text-fg-strong inline-flex items-center gap-4 uppercase transition-colors duration-200 motion-reduce:transition-none"
    >
      {label}
      {active && <Icon strokeWidth={1.5} aria-hidden="true" className="size-14" />}
    </Link>
  );
}

/** The leads list in the shared table. Sorting, filtering and paging are links, so they happen on the server (root rules). */
export function LeadsTable({ leads, params, canUpdate }: { leads: readonly Lead[]; params: LeadListParams; canUpdate: boolean }) {
  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "name",
      header: () => <SortHeader label="Name" field="name" params={params} />,
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
      header: () => <SortHeader label="Status" field="status" params={params} />,
      cell: ({ row }) => (
        <LeadStatusSelect id={row.original.id} name={row.original.name} status={row.original.status} canUpdate={canUpdate} />
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => <SortHeader label="Received" field="createdAt" params={params} />,
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
