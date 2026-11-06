"use client";

import type { ReactNode } from "react";

import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { InlineError } from "./InlineError";

/**
 * A question with two answers, for an action that changes or removes something (DESIGN.md section 7.7). `children` says what will
 * change. A destructive action uses the `dark` button; anything else the `primary` one. A failure shows inside the dialog, which
 * stays open so the person can try again.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  destructive,
  disabled,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** The confirm button while the request runs, e.g. "Removing". */
  pendingLabel: string;
  pending: boolean;
  error: string | null;
  destructive?: boolean;
  /** Keeps the confirm button off until the dialog's own input is complete. */
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant={destructive ? "dark" : "primary"} onClick={onConfirm} disabled={pending || disabled}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {error && <InlineError className="mt-12">{error}</InlineError>}
    </Dialog>
  );
}
