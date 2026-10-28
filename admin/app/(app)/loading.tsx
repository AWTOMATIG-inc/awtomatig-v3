import { Skeleton } from "@/components/ui";

/** Static skeletons in place of each block: no spinner screen, no shimmer (DESIGN.md section 8.2). */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-24 h-36 w-200" />
      <div className="flex flex-col gap-24">
        <div className="grid grid-cols-1 gap-20 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-120" />
          <Skeleton className="h-120" />
          <Skeleton className="h-120" />
          <Skeleton className="h-120" />
        </div>
        <div className="grid gap-20 lg:grid-cols-3">
          <Skeleton className="h-300 lg:col-span-2" />
          <Skeleton className="h-300" />
        </div>
        <Skeleton className="h-240" />
      </div>
    </div>
  );
}
