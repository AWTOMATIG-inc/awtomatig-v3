"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentPropsWithoutRef, useState } from "react";

import { cn } from "@/lib/cn";

import { Input } from "./Field";

/**
 * A password field with a button inside it that shows or hides what was typed. It starts hidden. The button is a real
 * `<button>` with a label and `aria-pressed`, so a screen reader announces "Show password, toggle button"; it keeps the
 * global focus ring when reached with the keyboard.
 */
export function PasswordInput({
  className,
  invalid,
  ...props
}: Omit<ComponentPropsWithoutRef<"input">, "type"> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Hide password" : "Show password";
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      {/* `pe-44` keeps the typed text clear of the button. */}
      <Input type={visible ? "text" : "password"} invalid={invalid} className={cn("pe-44", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="text-fg-muted hover:text-fg-strong ease-out-quint rounded-6 absolute inset-y-0 end-0 flex w-40 items-center justify-center transition-colors duration-200 before:absolute before:inset-x-0 before:-inset-y-2 motion-reduce:transition-none"
      >
        <Icon strokeWidth={1.5} aria-hidden="true" className="size-18" />
      </button>
    </div>
  );
}
