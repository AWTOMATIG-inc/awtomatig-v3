"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { MoveButtons } from "@/components/cms/MoveButtons";
import { DataTable, SortHeader, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import {
  answerExcerpt,
  type Faq,
  faqHref,
  type FaqListParams,
  FAQ_STATUS_LABEL,
  faqsHref,
  type FaqSort,
  faqTone,
} from "@/lib/cms/faqs";
import { moveFaq } from "@/lib/cms/reorder";

import { FaqActions } from "./FaqActions";

/** Where a click on a column title leads: that column sorted, or the opposite direction when it already is. */
function sortHref(params: FaqListParams, field: FaqSort): string {
  const active = params.sort === field;
  const order = active ? (params.order === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
  return faqsHref({ ...params, sort: field, order, page: 1 });
}

function Header({ label, field, params }: { label: string; field: FaqSort; params: FaqListParams }) {
  return <SortHeader label={label} href={sortHref(params, field)} active={params.sort === field} order={params.order} />;
}

/**
 * The FAQ list in the shared table. Sorting, filtering and paging are links, so they happen on the server. With the list in
 * display order and unfiltered, each row also has move buttons; every row has Edit, Publish / Unpublish and Delete.
 */
export function FaqsTable({
  faqs,
  params,
  firstPosition,
  total,
  canUpdate,
  canDelete,
  reorderable,
}: {
  faqs: readonly Faq[];
  params: FaqListParams;
  /** The position of the first row on this page, counting from 0, so the first and last row can have disabled move buttons. */
  firstPosition: number;
  total: number;
  canUpdate: boolean;
  canDelete: boolean;
  reorderable: boolean;
}) {
  const columns: ColumnDef<Faq>[] = [
    ...(reorderable && canUpdate
      ? [
          {
            id: "order",
            header: () => <Header label="Order" field="sortOrder" params={params} />,
            cell: ({ row }) => (
              <MoveButtons
                label={`“${row.original.question}”`}
                canMoveUp={firstPosition + row.index > 0}
                canMoveDown={firstPosition + row.index < total - 1}
                move={(direction) => moveFaq(row.original.id, direction)}
              />
            ),
          } satisfies ColumnDef<Faq>,
        ]
      : []),
    {
      id: "question",
      header: () => <Header label="Question" field="question" params={params} />,
      cell: ({ row }) => (
        <div className="max-w-420 min-w-240">
          <Link
            href={faqHref(row.original.id)}
            className="text-fg-strong ease-out-quint font-medium underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
          >
            {row.original.question}
          </Link>
          <p className="type-caption-12 text-fg-muted mt-2">{answerExcerpt(row.original.answer)}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge tone={faqTone()}>{FAQ_STATUS_LABEL[row.original.status]}</StatusBadge>,
    },
    {
      id: "created",
      header: () => <Header label="Created" field="createdAt" params={params} />,
      cell: ({ row }) => <span className="tabular-nums">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-8">
          <FaqActions
            variant="row"
            canUpdate={canUpdate}
            canDelete={canDelete}
            faq={{ id: row.original.id, question: row.original.question, status: row.original.status }}
          />
        </div>
      ),
    },
  ];

  const filtered = Boolean(params.status ?? params.q);
  return (
    <DataTable
      columns={columns}
      data={faqs}
      caption="FAQs"
      emptyMessage={filtered ? "No FAQs match these filters." : "No FAQs yet. Create the first one to show it on the website."}
    />
  );
}
