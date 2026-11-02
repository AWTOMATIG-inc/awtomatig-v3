import { formatNumber } from "@/lib/format";

import { Button } from "./Button";

/** The footer of a paged list: "1–20 of 45" on the left, Previous and Next on the right (DESIGN.md section 7.3). */
export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** The list's URL for a page number. */
  hrefFor: (page: number) => string;
}) {
  if (total === 0) return null;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="border-border type-body-14 text-fg-muted flex flex-wrap items-center justify-between gap-12 border-t px-16 py-12">
      <p>
        {formatNumber((page - 1) * pageSize + 1)}–{formatNumber(Math.min(page * pageSize, total))} of {formatNumber(total)}
      </p>
      <div className="flex items-center gap-8">
        {page > 1 ? (
          <Button href={hrefFor(page - 1)} size="sm">
            Previous
          </Button>
        ) : (
          <Button size="sm" disabled>
            Previous
          </Button>
        )}
        {page < lastPage ? (
          <Button href={hrefFor(page + 1)} size="sm">
            Next
          </Button>
        ) : (
          <Button size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
