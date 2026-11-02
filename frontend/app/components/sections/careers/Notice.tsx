import type { ReactNode } from "react";

/** A calm message panel for the careers pages: no vacancies, a load failure, a job that no longer accepts applications. */
export default function Notice({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="rounded-16 bg-surface p-24 lg:p-40">
      <h2 className="type-heading-28">{title}</h2>
      <div className="type-body-16 text-fg-primary mt-12 max-w-640">{children}</div>
      {actions && <div className="mt-24 flex flex-wrap gap-12">{actions}</div>}
    </div>
  );
}
