import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "glass" | "tint" | "dark" | "light" | "outline";
export type ButtonSize = "md" | "lg";

type BaseProps = {
  /** primary: cyan CTA · glass: bordered, on dark · tint: borderless, on dark/glass · dark: charcoal · light: white · outline: on light. See DESIGN.md §10 */
  variant?: ButtonVariant;
  /** md = 40px (nav, inline), lg = 54px (hero / section CTAs) */
  size?: ButtonSize;
  /** Leading icon, e.g. <WhatsAppIcon /> */
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof BaseProps> & { href?: undefined };

type ButtonAsLink = BaseProps & Omit<ComponentPropsWithoutRef<"a">, keyof BaseProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: Pick<BaseProps, "variant" | "size" | "fullWidth" | "className"> = {}) {
  return ["btn", `btn-${variant}`, `btn-${size}`, fullWidth && "btn-full", className].filter(Boolean).join(" ");
}

/**
 * Renders a <button>, or a link when `href` is given
 * (next/link for internal "/…" routes, a plain <a> for #anchors, mailto:, tel: and external URLs).
 */
export default function Button(props: ButtonProps) {
  const { variant, size, icon, fullWidth, className, children, ...rest } = props;
  const classes = buttonClassName({ variant, size, fullWidth, className });

  const content = (
    <>
      {icon && (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="btn-label">{children}</span>
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
