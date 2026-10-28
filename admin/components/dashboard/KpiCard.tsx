import Link from "next/link";

import type { Kpi } from "@/lib/dashboard/types";

/**
 * A label, one figure and at most one line of context. The whole card links to the list it counts. No icon, no sparkline,
 * no colored background (DESIGN.md section 7.5).
 */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Link
      href={kpi.href}
      className="rounded-12 border-border bg-surface ease-out-quint block h-full border p-20 transition-colors duration-200 hover:border-black/40 motion-reduce:transition-none"
    >
      <p className="type-caption-12 text-fg-muted uppercase">{kpi.label}</p>
      <p className="type-heading-40 text-fg-strong mt-8 font-normal tabular-nums">{kpi.value}</p>
      {kpi.context && <p className="type-body-14 text-fg-muted mt-4">{kpi.context}</p>}
    </Link>
  );
}
