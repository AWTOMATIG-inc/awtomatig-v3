import { cn } from "@/lib/cn";

export type StatusTone = "neutral" | "error" | "caution" | "warning";

// Positive and neutral states carry no color; only states that need attention get a static dot (DESIGN.md section 7.4).
// The label is always charcoal text: red and amber fail contrast as text, so color is never the only signal.
const DOT: Record<StatusTone, string | null> = {
  neutral: null,
  error: "bg-status-error",
  caution: "bg-status-caution",
  warning: "bg-status-warning",
};

export function StatusBadge({ tone = "neutral", children }: { tone?: StatusTone; children: string }) {
  const dot = DOT[tone];
  return (
    <span className="type-caption-12 rounded-6 bg-surface-subtle text-fg-primary inline-flex items-center gap-6 px-8 py-2 whitespace-nowrap">
      {dot && <span aria-hidden="true" className={cn("size-6 shrink-0 rounded-full", dot)} />}
      {children}
    </span>
  );
}
