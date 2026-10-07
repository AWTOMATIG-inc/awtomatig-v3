import Image from "next/image";
import type { ReactNode } from "react";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { Eyebrow } from "@/app/components/ui";

type IntroSectionProps = {
  /** Anchor id; the page hero's primary button usually scrolls here */
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks (three lines in the design) */
  title: ReactNode;
  /** Muted lead paragraph, with desktop `<br>`s like the title */
  lead: ReactNode;
};

/** Off-white page intro under an inner-page hero (Services "What we do", Case Studies "All case studies"):
 *  eyebrow, Heading / 60 title, Body / 22 muted lead and the brand mark cropped by the top edge (DESIGN.md §10.4). */
export default function IntroSection({ id, eyebrow, title, lead }: IntroSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId} className="relative overflow-hidden bg-surface-subtle text-fg-strong">
      {/* Brand mark, cropped by the top edge; smaller below xl so it clears the paragraph */}
      <Image
        src={Decor}
        alt=""
        className="pointer-events-none absolute -top-63 -right-43 h-auto w-160 opacity-20 select-none lg:-top-95 lg:-right-64 lg:w-240 xl:-top-125 xl:-right-85 xl:w-317"
      />

      <div className="site-container relative grid gap-20 pt-60 pb-60 lg:grid-cols-[349fr_982fr] lg:gap-0 lg:pt-121 lg:pb-117">
        <Eyebrow className="self-start lg:mt-5">{eyebrow}</Eyebrow>

        <div>
          <h2 id={titleId} className="type-heading-60">
            {title}
          </h2>
          <p className="type-body-16 mt-20 max-w-640 text-fg-muted lg:type-body-22 lg:mt-32 lg:max-w-none">{lead}</p>
        </div>
      </div>
    </section>
  );
}
