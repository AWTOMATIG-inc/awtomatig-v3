"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";

import { MoveButtons } from "@/components/cms/MoveButtons";
import { DataTable, SortHeader, StatusBadge } from "@/components/ui";
import {
  caseStudiesHref,
  caseStudyHref,
  caseStudyStateLabel,
  caseStudyTone,
  type CaseStudyListParams,
  type CaseStudySort,
  type CaseStudySummary,
  SERVICE_LABEL,
} from "@/lib/cms/case-studies";
import { moveCaseStudy } from "@/lib/cms/reorder";
import { formatDate } from "@/lib/format";

import { CaseStudyActions } from "./CaseStudyActions";

/** Where a click on a column title leads: that column sorted, or the opposite direction when it already is. */
function sortHref(params: CaseStudyListParams, field: CaseStudySort): string {
  const active = params.sort === field;
  const order = active ? (params.order === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
  return caseStudiesHref({ ...params, sort: field, order, page: 1 });
}

function Header({ label, field, params }: { label: string; field: CaseStudySort; params: CaseStudyListParams }) {
  return <SortHeader label={label} href={sortHref(params, field)} active={params.sort === field} order={params.order} />;
}

/**
 * The case studies list in the shared table. Sorting, filtering and paging are links, so they happen on the server. With the
 * list in display order and unfiltered, each row also has move buttons; every row has Edit, Publish / Unpublish and Delete.
 */
export function CaseStudiesTable({
  studies,
  params,
  firstPosition,
  total,
  canUpdate,
  canDelete,
  reorderable,
}: {
  studies: readonly CaseStudySummary[];
  params: CaseStudyListParams;
  /** The position of the first row on this page, counting from 0, so the first and last study can have disabled move buttons. */
  firstPosition: number;
  total: number;
  canUpdate: boolean;
  canDelete: boolean;
  reorderable: boolean;
}) {
  const columns: ColumnDef<CaseStudySummary>[] = [
    ...(reorderable && canUpdate
      ? [
          {
            id: "order",
            header: () => <Header label="Order" field="sortOrder" params={params} />,
            cell: ({ row }) => (
              <MoveButtons
                label={row.original.title}
                move={(direction) => moveCaseStudy(row.original.id, direction)}
                canMoveUp={firstPosition + row.index > 0}
                canMoveDown={firstPosition + row.index < total - 1}
              />
            ),
          } satisfies ColumnDef<CaseStudySummary>,
        ]
      : []),
    {
      id: "image",
      header: "Image",
      cell: ({ row }) =>
        row.original.image ? (
          <span className="rounded-6 border-border bg-surface-subtle relative block h-40 w-44 overflow-hidden border">
            <Image src={row.original.image.url} alt="" fill unoptimized sizes="44px" className="object-cover" />
          </span>
        ) : (
          <span className="type-caption-12 text-fg-muted">None</span>
        ),
    },
    {
      accessorKey: "title",
      header: () => <Header label="Case study" field="title" params={params} />,
      cell: ({ row }) => (
        <div className="min-w-160">
          <Link
            href={caseStudyHref(row.original.id)}
            className="text-fg-strong ease-out-quint font-medium underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
          >
            {row.original.title}
          </Link>
          <p className="type-caption-12 text-fg-muted">{row.original.client}</p>
        </div>
      ),
    },
    { accessorKey: "service", header: "Service", cell: ({ row }) => SERVICE_LABEL[row.original.service] },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge tone={caseStudyTone(row.original)}>{caseStudyStateLabel(row.original)}</StatusBadge>,
    },
    {
      accessorKey: "createdAt",
      header: () => <Header label="Created" field="createdAt" params={params} />,
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-8">
          <CaseStudyActions
            variant="row"
            canUpdate={canUpdate}
            canDelete={canDelete}
            study={{
              id: row.original.id,
              title: row.original.title,
              status: row.original.status,
              hasImage: row.original.image !== null,
            }}
          />
        </div>
      ),
    },
  ];

  const filtered = Boolean(params.status ?? params.q);
  return (
    <DataTable
      columns={columns}
      data={studies}
      caption="Case studies"
      emptyMessage={
        filtered ? "No case studies match these filters." : "No case studies yet. Create the first one to show it on the website."
      }
    />
  );
}
