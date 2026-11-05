import Image from "next/image";
import type { ReactNode } from "react";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { Eyebrow } from "@/app/components/ui";
import WorkPathTimeline from "../../campaign/how-we-work/WorkPathTimeline";
import type { WorkStep } from "../../campaign/how-we-work/workPath";

type HowWeWorkSectionProps = {
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  lead: ReactNode;
  steps: WorkStep[];
  /** `grid-template-columns` class for the step count, measured from the design */
  columns: string;
};

/** Service detail "How we work": off-white, the brand mark cropped by the top-right corner, eyebrow + Heading / 60 title +
 *  muted lead, then the auto-advancing step timeline (the campaign page's `WorkPathTimeline`). */
export default function HowWeWorkSection({ id, eyebrow, title, lead, steps, columns }: HowWeWorkSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-surface-subtle text-fg-strong relative overflow-hidden">
      <Image
        src={Decor}
        alt=""
        className="pointer-events-none absolute -top-131 -right-43 h-auto w-160 opacity-20 select-none lg:-top-196 lg:-right-64 lg:w-240 xl:-top-259 xl:-right-85 xl:w-317"
      />

      <div className="site-container relative py-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-20 lg:grid-cols-[318fr_1002fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">{eyebrow}</Eyebrow>
          <div>
            <h2 id={`${id}-title`} className="type-heading-60">
              {title}
            </h2>
            <p className="type-body-16 text-fg-muted lg:type-body-20 mt-20 max-w-640 lg:mt-24 lg:max-w-none">{lead}</p>
          </div>
        </div>

        <div className="mt-48 lg:mt-100">
          <WorkPathTimeline steps={steps} columns={columns} />
        </div>
      </div>
    </section>
  );
}
