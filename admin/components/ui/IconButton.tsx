import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A square 32px button with only an icon, for a row of small actions (move, remove). The 44px touch target comes from the
 * pseudo-element, as on `Button`'s small size. Always give it an `aria-label`: there is no visible text.
 */
export function IconButton({
  label,
  icon,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label"> & {
  /** What the button does, for screen readers and as the tooltip. */
  label: string;
  /** e.g. <ArrowUp strokeWidth={1.5} /> */
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "rounded-6 border-border text-fg-strong ease-out-quint hover:border-charcoal/40 hover:bg-surface-subtle relative inline-flex size-32 items-center justify-center border bg-transparent",
        "transition-[background-color,border-color,color] duration-200 before:absolute before:-inset-6",
        "disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex size-16 *:size-full">
        {icon}
      </span>
    </button>
  );
}
