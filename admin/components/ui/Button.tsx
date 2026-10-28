import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "dark" | "light";
export type ButtonSize = "sm" | "md";

type BaseProps = {
  /** primary: the one main action of a view · outline: secondary on white · dark: strong or destructive confirmation · light: on the charcoal sidebar. DESIGN.md section 7.1 */
  variant?: ButtonVariant;
  /** md = 40px (forms, toolbars) · sm = 32px (table row actions, dense toolbars) */
  size?: ButtonSize;
  /** Leading icon, e.g. <Plus strokeWidth={1.5} /> */
  icon?: ReactNode;
  fullWidth?: boolean;
  /** Layout only (width, margin, flex). Never repeat a property the button sets: add a size or variant instead. */
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps & Omit<ComponentPropsWithoutRef<"button">, keyof BaseProps> & { href?: undefined };
type ButtonAsLink = BaseProps & Omit<ComponentPropsWithoutRef<"a">, keyof BaseProps> & { href: string };
export type ButtonProps = ButtonAsButton | ButtonAsLink;

// The website's button without the hover lift and glow: the admin changes color only (DESIGN.md sections 1.1 and 6).
const BASE =
  "relative inline-flex items-center justify-center border font-sans leading-none font-semibold whitespace-nowrap uppercase no-underline select-none " +
  "transition-[background-color,border-color,color] duration-200 ease-out-quint " +
  "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40 " +
  "motion-reduce:transition-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-action-primary text-on-action hover:bg-action-primary-bright",
  outline: "border-border bg-transparent text-fg-strong hover:border-charcoal/40 hover:bg-surface-subtle",
  dark: "border-transparent bg-surface-inverse text-fg-inverse hover:bg-black",
  light: "border-transparent bg-surface text-fg-strong hover:bg-off-white",
};

// The 44px touch target of the small size comes from the before: pseudo-element, so the visible size stays 32px.
const SIZES: Record<ButtonSize, { root: string; icon: string }> = {
  md: { root: "h-40 gap-10 rounded-6 px-16 text-button-md", icon: "size-16" },
  sm: { root: "h-32 gap-8 rounded-6 px-12 text-button-md before:absolute before:-inset-y-6 before:inset-x-0", icon: "size-16" },
};

/** Renders a <button>, or a link when `href` is given (next/link for internal "/…" routes, a plain <a> otherwise). */
export function Button(props: ButtonProps) {
  const { variant = "outline", size = "md", icon, fullWidth, className, children, ...rest } = props;
  const classes = cn(BASE, VARIANTS[variant], SIZES[size].root, fullWidth && "w-full", className);

  const content = (
    <>
      {icon && (
        <span className={cn("inline-flex shrink-0 *:size-full", SIZES[size].icon)} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </>
  );

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as Omit<ButtonAsLink, keyof BaseProps>;
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes} {...anchorProps}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...anchorProps}>
        {content}
      </a>
    );
  }

  const { type = "button", ...buttonProps } = rest as Omit<ButtonAsButton, keyof BaseProps>;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
