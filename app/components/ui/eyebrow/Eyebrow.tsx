import Image from "next/image";
import type { ReactNode } from "react";
import Mark from "@/public/images/awtomatig-logo.png";

type EyebrowProps = {
  children: ReactNode;
  /** Layout only (margin, alignment). The text color is inherited from the surface. */
  className?: string;
  /** Tint for the brand mark on a surface where its cyan would vanish (e.g. `brightness-0 invert` on a cyan card) */
  markClassName?: string;
};

/** Brand mark + uppercase label above a section title (DESIGN.md §10.4). */
export default function Eyebrow({ children, className, markClassName }: EyebrowProps) {
  return (
    <p className={`type-label-14 flex items-center gap-12 uppercase ${className ?? ""}`}>
      <Image src={Mark} alt="" width={16} height={22} className={`h-auto w-16 shrink-0 ${markClassName ?? ""}`} />
      <span>{children}</span>
    </p>
  );
}
