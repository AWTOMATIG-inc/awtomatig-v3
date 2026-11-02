import type { ReactNode } from "react";

/** Text input, select and textarea surface (a grey fill; no focus styling, see MEMORY.md D62; `aria-invalid` adds an orange outline). Add `h-auto py-12` for a textarea. */
export const FIELD =
  "type-body-14 h-48 w-full rounded-8 bg-surface-subtle px-16 text-fg-strong placeholder:text-black/40 transition-colors duration-200 hover:bg-off-white motion-reduce:transition-none aria-invalid:outline-1 aria-invalid:outline-status-warning";

/** Small uppercase label above a field or a group of chips. */
export const LABEL = "type-caption-12 block font-medium uppercase";

export function Required() {
  return (
    <span aria-hidden="true" className="text-status-warning">
      {" "}
      *
    </span>
  );
}

/**
 * A label above a control. Give the control `id={htmlFor}`. With `error`, the message shows under it and the control should
 * set `aria-invalid` and `aria-describedby={`${htmlFor}-error`}`.
 */
export default function Field({
  label,
  required,
  children,
  htmlFor,
  error,
  hint,
  labelClassName = LABEL,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: string;
  /** Defaults to the small uppercase label; pass a sentence style for a long question. */
  labelClassName?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
        {required && <Required />}
      </label>
      <div className="mt-8">{children}</div>
      {hint && !error && <p className="type-caption-12 text-fg-muted mt-6">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="type-caption-12 text-fg-strong mt-6 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
