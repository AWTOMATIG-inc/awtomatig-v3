import type { ReactNode } from "react";

/** The one `h1` of a page: a `type-heading-28` title, optional description, and the page's actions on the right. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-24 flex flex-wrap items-end justify-between gap-16">
      <div className="min-w-0">
        <h1 className="type-heading-28 text-fg-strong">{title}</h1>
        {description && <p className="type-body-14 text-fg-muted mt-4">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-12">{actions}</div>}
    </div>
  );
}
