import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A message about a request that failed, under the control that started it: charcoal text with a static red dot, never red text
 * (DESIGN.md section 3.2). Announced to screen readers as an alert.
 */
export function InlineError({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn("type-body-14 text-fg-primary flex items-start gap-8", className)}>
      <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
