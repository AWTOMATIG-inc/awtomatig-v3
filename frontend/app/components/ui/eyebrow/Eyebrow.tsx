import Image from "next/image";
import type { ReactNode } from "react";
import Mark from "@/public/images/awtomatig-logo.png";

type EyebrowProps = {
  children: ReactNode;
  /** Layout only (margin, alignment). The text color is inherited from the surface. */
  className?: string;
  /** Tint for the brand mark on a surface where its cyan would vanish (e.g. `brightness-0 invert` on a cyan card) */
  markClassName?: string;
  /** `sm` is the phone hero eyebrow (12.4px label, 14px mark); from md up both sizes are the same */
  size?: "md" | "sm";
};

const SIZES = {
  md: { text: "type-label-14", mark: "w-16" },
  sm: { text: "type-label-12 md:type-label-14", mark: "w-14 md:w-16" },
};

/** Brand mark + uppercase label above a section title (DESIGN.md §10.4). */
export default function Eyebrow({ children, className, markClassName, size = "md" }: EyebrowProps) {
  return (
    <p className={`${SIZES[size].text} flex items-center gap-12 uppercase ${className ?? ""}`}>
      <Image src={Mark} alt="" width={16} height={22} className={`h-auto shrink-0 ${SIZES[size].mark} ${markClassName ?? ""}`} />
      <span>{children}</span>
    </p>
  );
}
