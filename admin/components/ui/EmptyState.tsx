import type { ReactNode } from "react";

/** One centered, factual line, and at most one next step. No illustration, no exclamation mark (DESIGN.md section 7.3). */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-16 px-20 py-40 text-center">
      <p className="type-body-16 text-fg-muted">{children}</p>
      {action}
    </div>
  );
}
