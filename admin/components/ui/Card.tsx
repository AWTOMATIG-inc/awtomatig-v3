import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** White surface, 1px border, no shadow (DESIGN.md section 3.3). Shadows are for things that float. */
export function Card({ className, children, ...props }: { className?: string; children: ReactNode; "aria-labelledby"?: string }) {
  return (
    <section className={cn("rounded-12 border-border bg-surface border", className)} {...props}>
      {children}
    </section>
  );
}

/** The title row of a card: a `type-heading-18` title, an optional subtitle and an optional action on the right. */
export function CardHeader({
  title,
  subtitle,
  action,
  id,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-16 p-20 pb-0">
      <div className="min-w-0">
        <h2 id={id} className="type-heading-18 text-fg-strong">
          {title}
        </h2>
        {subtitle && <p className="type-body-14 text-fg-muted mt-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
