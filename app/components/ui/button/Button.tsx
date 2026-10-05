import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "glass" | "tint" | "dark" | "light" | "outline";
export type ButtonSize = "md" | "lg" | "card" | "xl" | "nav";

type BaseProps = {
  /** primary: cyan CTA · glass: bordered, on dark · tint: borderless, on dark/glass · dark: charcoal · light: white · outline: on light. See DESIGN.md §10 */
  variant?: ButtonVariant;
  /** md = 40px (inline, cards), lg = 54px (hero / section CTAs), card = 46px (case study cards), xl = 56px stacked footer CTAs, nav = the navbar CTA */
  size?: ButtonSize;
  /** Leading icon, e.g. <WhatsAppIcon /> */
  icon?: ReactNode;
  /** Trailing icon after the label, e.g. <ArrowUpRightIcon /> */
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  /** Layout only (width, margin, flex). Never repeat a property the button sets (height, padding, font size, colors): add a size or variant instead. */
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof BaseProps> & { href?: undefined };

type ButtonAsLink = BaseProps & Omit<ComponentPropsWithoutRef<"a">, keyof BaseProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Shared by every variant (the radius comes with the size). Inside a frame-scaled section (header, hero) the spacing utilities and
// text-button-* sizes follow --u, so the button scales with the 1440 frame there.
const BASE =
  "relative inline-flex items-center justify-center border font-sans leading-none font-semibold whitespace-nowrap uppercase no-underline select-none " +
  "transition-[background-color,border-color,color,box-shadow,translate] duration-250 ease-out-expo active:translate-y-0 " +
  "disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none " +
  "aria-disabled:pointer-events-none aria-disabled:translate-y-0 aria-disabled:opacity-40 aria-disabled:shadow-none " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0";

// Pick by the surface the button sits on (DESIGN.md §10.2). Each variant owns its border color.
const VARIANTS: Record<ButtonVariant, string> = {
  // Cyan fill, black label. One per viewport.
  primary:
    "border-transparent bg-action-primary text-on-action hover:-translate-y-1 hover:bg-action-primary-bright hover:shadow-glow-strong",
  // Translucent deep teal with a hairline border. Dark surfaces only.
  glass:
    "border-white/12 bg-linear-to-b from-deep-teal/45 to-deep-teal/5 text-fg-inverse hover:-translate-y-1 hover:border-white/20 hover:bg-deep-teal/40 hover:shadow-glow-subtle",
  // Borderless dark tint over the surface behind it. Dark or glass surfaces (navbar).
  tint: "border-transparent bg-linear-to-b from-black/25 via-black/35 via-45% to-black/30 text-fg-inverse hover:-translate-y-1 hover:bg-black/12",
  // Charcoal fill, white label. Light or cyan surfaces.
  dark: "border-transparent bg-surface-inverse text-fg-inverse hover:-translate-y-1 hover:bg-black",
  // White fill, black label. Dark or off-white surfaces.
  light: "border-transparent bg-surface text-fg-strong hover:-translate-y-1 hover:bg-off-white",
  // Transparent with a gray border. Light surfaces only; no lift.
  outline: "border-border bg-transparent text-fg-strong hover:border-charcoal/40 hover:bg-white/60",
};

const SIZES: Record<ButtonSize, { root: string; icon: string; label?: string }> = {
  md: { root: "h-40 rounded-6 gap-10 px-16 text-button-md", icon: "size-16" },
  // 50px below the desktop breakpoint
  lg: { root: "h-50 rounded-6 gap-10 px-16 text-button-md lg:h-54 lg:px-24 lg:text-button-lg", icon: "size-18" },
  // Case study cards: 46px with the lg label (measured from the screenshot); 50px below the desktop breakpoint
  card: { root: "h-50 rounded-6 gap-14 px-24 text-button-md lg:h-46 lg:text-button-lg", icon: "size-18" },
  // Footer CTA stack: Figma 56px, radius/12, 20px icon, 14px gap
  xl: { root: "h-50 rounded-12 gap-14 px-24 text-button-md lg:h-56 lg:text-button-lg", icon: "size-20" },
  // Navbar CTA: 36px to line up with the menu toggle on mobile, icon only below 360px (label stays
  // readable to screen readers); Figma 40px, 17px icon, 11px gap, 13.5px label from lg
  nav: {
    root: "h-36 rounded-6 gap-8 px-12 text-button-sm max-xs:w-36 max-xs:px-0 lg:h-40 lg:gap-11 lg:px-16 lg:text-button-nav",
    icon: "size-15 lg:size-17",
    label: "max-xs:sr-only",
  },
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: Pick<BaseProps, "variant" | "size" | "fullWidth" | "className"> = {}) {
  return [BASE, VARIANTS[variant], SIZES[size].root, fullWidth && "w-full", className].filter(Boolean).join(" ");
}

/**
 * Renders a <button>, or a link when `href` is given
 * (next/link for internal "/…" routes, a plain <a> for #anchors, mailto:, tel: and external URLs).
 */
export default function Button(props: ButtonProps) {
  const { variant, size = "md", icon, iconEnd, fullWidth, className, children, ...rest } = props;
  const classes = buttonClassName({ variant, size, fullWidth, className });

  const content = (
    <>
      {icon && (
        <span className={`inline-flex shrink-0 *:size-full ${SIZES[size].icon}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={SIZES[size].label}>{children}</span>
      {iconEnd && (
        <span className={`inline-flex shrink-0 *:size-full ${SIZES[size].icon}`} aria-hidden="true">
          {iconEnd}
        </span>
      )}
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
