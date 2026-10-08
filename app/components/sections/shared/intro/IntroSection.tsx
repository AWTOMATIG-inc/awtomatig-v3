import Image from "next/image";
import type { ReactNode } from "react";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { Eyebrow } from "@/app/components/ui";

// Brand mark offsets, measured per design; `high` sits 78px higher at xl (About "Our story"), scaled with the smaller marks
const MARK_POSITIONS = {
  default: "-top-63 lg:-top-95 xl:-top-125",
  high: "-top-102 lg:-top-154 xl:-top-203",
};

type IntroSectionProps = {
  /** Anchor id; the page hero's primary button usually scrolls here */
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks (three lines in the design) */
  title: ReactNode;
  /** Muted lead, with desktop `<br>`s like the title; pass an array for several paragraphs (About "Our story") */
  lead: ReactNode | ReactNode[];
  /** Vertical position of the cropped brand mark */
  markPosition?: keyof typeof MARK_POSITIONS;
};

/** Off-white page intro under an inner-page hero (Services "What we do", Case Studies "All case studies", About "Our story"):
 *  eyebrow, Heading / 60 title, Body / 22 muted lead and the brand mark cropped by the top edge (DESIGN.md §10.4). */
export default function IntroSection({ id, eyebrow, title, lead, markPosition = "default" }: IntroSectionProps) {
  const titleId = `${id}-title`;
  const paragraphs = Array.isArray(lead) ? lead : [lead];

  return (
    <section id={id} aria-labelledby={titleId} className="relative overflow-hidden bg-surface-subtle text-fg-strong">
      {/* Brand mark, cropped by the top edge; smaller below xl so it clears the paragraph */}
      <Image
        src={Decor}
        alt=""
        className={`pointer-events-none absolute -right-43 h-auto w-160 opacity-20 select-none lg:-right-64 lg:w-240 xl:-right-85 xl:w-317 ${MARK_POSITIONS[markPosition]}`}
      />

      <div className="site-container relative grid gap-20 pt-60 pb-60 lg:grid-cols-[349fr_982fr] lg:gap-0 lg:pt-121 lg:pb-117">
        <Eyebrow className="self-start lg:mt-5">{eyebrow}</Eyebrow>

        <div>
          <h2 id={titleId} className="type-heading-60">
            {title}
          </h2>
          <div className="type-body-16 mt-20 max-w-640 space-y-12 text-fg-muted lg:type-body-22 lg:mt-32 lg:max-w-none lg:space-y-10">
            {paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
