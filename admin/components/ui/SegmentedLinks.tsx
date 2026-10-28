import Link from "next/link";

import { cn } from "@/lib/cn";

export interface SegmentedOption {
  label: string;
  href: string;
  selected: boolean;
}

/**
 * A 40px group of two to four options in one bordered container; the selected one is charcoal (DESIGN.md section 7.6).
 * Options are links, so the choice lives in the URL and works without JavaScript.
 */
export function SegmentedLinks({ label, options }: { label: string; options: readonly SegmentedOption[] }) {
  return (
    <nav aria-label={label} className="rounded-6 border-border bg-surface inline-flex h-40 items-stretch gap-2 border p-2">
      {options.map((option) => (
        <Link
          key={option.label}
          href={option.href}
          aria-current={option.selected ? "true" : undefined}
          className={cn(
            "type-body-14 rounded-6 ease-out-quint inline-flex items-center px-12 transition-colors duration-200 motion-reduce:transition-none",
            option.selected ? "bg-surface-inverse text-fg-inverse" : "text-fg-muted hover:bg-surface-subtle hover:text-fg-strong",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
