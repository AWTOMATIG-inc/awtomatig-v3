"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";

import { MoveButtons } from "@/components/cms/MoveButtons";
import { DataTable, SortHeader, StatusBadge } from "@/components/ui";
import { SERVICE_LABEL } from "@/lib/cms/case-studies";
import { moveTestimonial } from "@/lib/cms/reorder";
import {
  quoteExcerpt,
  type Testimonial,
  testimonialHref,
  type TestimonialListParams,
  testimonialsHref,
  type TestimonialSort,
  testimonialStateLabel,
  testimonialTone,
} from "@/lib/cms/testimonials";

import { TestimonialActions } from "./TestimonialActions";

/** Where a click on a column title leads: that column sorted, or the opposite direction when it already is. */
function sortHref(params: TestimonialListParams, field: TestimonialSort): string {
  const active = params.sort === field;
  const order = active ? (params.order === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
  return testimonialsHref({ ...params, sort: field, order, page: 1 });
}

function Header({ label, field, params }: { label: string; field: TestimonialSort; params: TestimonialListParams }) {
  return <SortHeader label={label} href={sortHref(params, field)} active={params.sort === field} order={params.order} />;
}

/**
 * The testimonials list in the shared table. Sorting, filtering and paging are links, so they happen on the server. With the
 * list in display order and unfiltered, each row also has move buttons; every row has Edit, Publish / Unpublish and Delete.
 */
export function TestimonialsTable({
  testimonials,
  params,
  firstPosition,
  total,
  canUpdate,
  canDelete,
  reorderable,
}: {
  testimonials: readonly Testimonial[];
  params: TestimonialListParams;
  /** The position of the first row on this page, counting from 0, so the first and last row can have disabled move buttons. */
  firstPosition: number;
  total: number;
  canUpdate: boolean;
  canDelete: boolean;
  reorderable: boolean;
}) {
  const columns: ColumnDef<Testimonial>[] = [
    ...(reorderable && canUpdate
      ? [
          {
            id: "order",
            header: () => <Header label="Order" field="sortOrder" params={params} />,
            cell: ({ row }) => (
              <MoveButtons
                label={`${row.original.name}, ${row.original.company}`}
                canMoveUp={firstPosition + row.index > 0}
                canMoveDown={firstPosition + row.index < total - 1}
                move={(direction) => moveTestimonial(row.original.id, direction)}
              />
            ),
          } satisfies ColumnDef<Testimonial>,
        ]
      : []),
    {
      id: "logo",
      header: "Logo",
      cell: ({ row }) =>
        row.original.logo ? (
          // The website draws the logo on a white card, so the thumbnail is white too (and black when the logo is shown in black).
          <span className="rounded-6 border-border bg-surface relative block h-40 w-64 overflow-hidden border">
            <Image
              src={row.original.logo.url}
              alt=""
              fill
              unoptimized
              sizes="64px"
              className={row.original.logoInBlack ? "object-contain p-4 brightness-0" : "object-contain p-4"}
            />
          </span>
        ) : (
          <span className="type-caption-12 text-fg-muted">None</span>
        ),
    },
    {
      id: "person",
      header: () => <Header label="Person" field="name" params={params} />,
      cell: ({ row }) => (
        <div className="min-w-160">
          <Link
            href={testimonialHref(row.original.id)}
            className="text-fg-strong ease-out-quint font-medium underline-offset-4 transition-colors duration-200 hover:underline motion-reduce:transition-none"
          >
            {row.original.name}
          </Link>
          <p className="type-caption-12 text-fg-muted">
            {row.original.role} · {row.original.company}
          </p>
        </div>
      ),
    },
    {
      id: "quote",
      header: "Quote",
      cell: ({ row }) => <p className="max-w-360 min-w-200">{quoteExcerpt(row.original.quote)}</p>,
    },
    { accessorKey: "service", header: "Service", cell: ({ row }) => SERVICE_LABEL[row.original.service] },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge tone={testimonialTone(row.original)}>{testimonialStateLabel(row.original)}</StatusBadge>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-8">
          <TestimonialActions
            variant="row"
            canUpdate={canUpdate}
            canDelete={canDelete}
            testimonial={{
              id: row.original.id,
              name: row.original.name,
              company: row.original.company,
              status: row.original.status,
              consentConfirmed: row.original.consentConfirmed,
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
      data={testimonials}
      caption="Testimonials"
      emptyMessage={
        filtered ? "No testimonials match these filters." : "No testimonials yet. Create the first one to show it on the website."
      }
    />
  );
}
