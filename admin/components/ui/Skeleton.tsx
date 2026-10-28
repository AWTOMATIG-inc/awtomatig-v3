import { cn } from "@/lib/cn";

/** A flat placeholder block. Static on purpose: no shimmer, no pulse (DESIGN.md section 6). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded-6 bg-surface-subtle", className)} />;
}
