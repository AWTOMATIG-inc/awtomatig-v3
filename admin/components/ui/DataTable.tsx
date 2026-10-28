"use client";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { cn } from "@/lib/cn";

import { EmptyState } from "./EmptyState";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Right-align and use tabular figures. Set it on every numeric or money column. */
    numeric?: boolean;
  }
}

/**
 * The one table every list uses (DESIGN.md section 7.3): a 40px header row, 48px body rows with a hairline between them,
 * numbers right-aligned and tabular. Sorting, filtering and pagination are server-side: this component only renders the
 * rows it is given. Put it inside a `Card`.
 */
export function DataTable<TData>({
  columns,
  data,
  caption,
  emptyMessage,
}: {
  columns: ColumnDef<TData>[];
  data: readonly TData[];
  /** Describes the table to screen readers. */
  caption: string;
  emptyMessage: string;
}) {
  // TanStack Table returns functions React Compiler cannot memoize; nothing here is passed to a memoized child, so it is safe.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ columns, data: data as TData[], getCoreRowModel: getCoreRowModel() });

  if (data.length === 0) return <EmptyState>{emptyMessage}</EmptyState>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="bg-surface-subtle h-40">
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className={cn(
                    "type-caption-12 text-fg-muted px-16 text-left tracking-normal uppercase",
                    header.column.columnDef.meta?.numeric && "text-right",
                  )}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-border ease-out-quint hover:bg-surface-subtle h-48 border-t transition-colors duration-200"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    "type-body-14 text-fg-primary px-16",
                    cell.column.columnDef.meta?.numeric && "text-right tabular-nums",
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
