import { Skeleton } from "@/components/ui";

/** Static skeletons while a content screen loads: a title, a toolbar and table rows (DESIGN.md section 8.2). No shimmer. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-24 h-36 w-240" />
      <div className="rounded-12 border-border bg-surface border">
        <div className="flex gap-12 p-16">
          <Skeleton className="h-40 w-320" />
          <Skeleton className="h-40 w-200" />
        </div>
        <div className="border-border flex flex-col gap-8 border-t p-16">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
