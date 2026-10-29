import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Label above, control, then a helper or an error. Pass the same `id` to the control (DESIGN.md section 7.2). */
export function Field({
  id,
  label,
  required,
  helper,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="type-body-14 text-fg-strong mb-6 block font-medium">
        {label}
        {required && (
          <span aria-hidden="true" className="text-fg-muted ml-2">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="type-body-14 text-fg-primary mt-6 flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {error}
        </p>
      ) : (
        helper && (
          <p id={`${id}-helper`} className="type-body-14 text-fg-muted mt-6">
            {helper}
          </p>
        )
      )}
    </div>
  );
}

const CONTROL =
  "type-body-14 h-40 w-full rounded-6 border bg-surface px-12 text-fg-primary placeholder:text-black/40 " +
  "transition-colors duration-200 ease-out-quint hover:border-black/40 " +
  "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-40 motion-reduce:transition-none";

// A table-row select: 32px tall and only as wide as its longest option, so it fits a 48px row.
const CONTROL_COMPACT = CONTROL.replace("h-40 w-full", "h-32 w-auto").replace("px-12", "px-8");

export function Select({
  className,
  invalid,
  compact,
  ...props
}: ComponentPropsWithoutRef<"select"> & { invalid?: boolean; compact?: boolean }) {
  return (
    <select
      className={cn(
        compact ? CONTROL_COMPACT : CONTROL,
        "cursor-pointer",
        invalid ? "border-status-error" : "border-border",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

/** A multi-line control: the same look as `Input`, but as tall as its rows and resizable vertically only. */
export function Textarea({ className, invalid, ...props }: ComponentPropsWithoutRef<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(CONTROL, "h-auto min-h-120 resize-y py-10", invalid ? "border-status-error" : "border-border", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Input({ className, invalid, ...props }: ComponentPropsWithoutRef<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={cn(CONTROL, invalid ? "border-status-error" : "border-border", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
