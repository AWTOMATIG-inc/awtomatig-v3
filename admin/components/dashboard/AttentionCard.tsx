import Link from "next/link";

import { Card, CardHeader, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { AttentionItem, AttentionTone } from "@/lib/dashboard/types";

// A static dot for things that need a decision; neutral rows get none. The state is also written out in the detail text.
const DOT: Record<AttentionTone, string | null> = { error: "bg-status-error", caution: "bg-status-caution", neutral: null };

/** The worklist: up to six actionable rows, each "what, who, how long", linking to the record (DESIGN.md section 8.1). */
export function AttentionCard({ items, className }: { items: readonly AttentionItem[]; className?: string }) {
  return (
    <Card className={className} aria-labelledby="attention-title">
      <CardHeader id="attention-title" title="Needs attention" />
      {items.length === 0 ? (
        <EmptyState>Nothing needs attention.</EmptyState>
      ) : (
        <ul className="mt-12 pb-8">
          {items.slice(0, 6).map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="ease-out-quint hover:bg-surface-subtle flex items-start gap-12 px-20 py-12 transition-colors duration-200 motion-reduce:transition-none"
              >
                <span
                  aria-hidden="true"
                  className={cn("mt-8 size-6 shrink-0 rounded-full", DOT[item.tone] ?? "bg-transparent")}
                />
                <span className="min-w-0">
                  <span className="type-body-14 text-fg-strong block truncate font-medium">{item.title}</span>
                  <span className="type-body-14 text-fg-muted block">{item.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
