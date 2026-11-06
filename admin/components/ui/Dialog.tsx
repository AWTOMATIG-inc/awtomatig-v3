"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { cn } from "@/lib/cn";

/**
 * A modal dialog (DESIGN.md section 7.7) on the browser's own `<dialog>`: it traps focus, closes on Esc, and puts focus back
 * where it was. `rounded-16`, `shadow-floating`, a black/40 scrim, 520px wide at most (`wide`: 720px, for a form). Put the actions
 * (Cancel first, then the action) in `actions`; a destructive confirmation names what will change in `children` and uses the
 * `dark` button. A tall form scrolls inside the dialog.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  wide,
}: {
  open: boolean;
  /** Called when the dialog closes by any route (Esc, a button that sets `open` to false). */
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  /** 720px instead of 520px, for dialogs that hold a form. */
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className={cn(
        "rounded-16 bg-surface text-fg-primary shadow-floating m-auto w-full overflow-y-auto p-24 backdrop:bg-black/40",
        wide ? "max-w-720" : "max-w-520",
      )}
    >
      <h2 id={titleId} className="type-heading-20 text-fg-strong">
        {title}
      </h2>
      <div className="type-body-14 mt-12">{children}</div>
      <div className="mt-24 flex flex-wrap justify-end gap-12">{actions}</div>
    </dialog>
  );
}
