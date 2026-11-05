import type { ReactNode } from "react";
import { Eyebrow } from "@/app/components/ui";
import FeatureGrid, { type Feature } from "../../shared/feature-grid/FeatureGrid";

type OverviewSectionProps = {
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  lead: ReactNode;
  /** The dark card on the left (top-aligned beside the grid) */
  card: ReactNode;
  features: Feature[];
};

/** Service detail "Overview": off-white, eyebrow + Heading / 60 title + muted lead, then a dark card beside the
 *  numbered 2×2 feature card (the Services "One operating ecosystem" layout). */
export default function OverviewSection({ id, eyebrow, title, lead, card, features }: OverviewSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-20 lg:grid-cols-[371fr_960fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">{eyebrow}</Eyebrow>
          <div>
            <h2 id={`${id}-title`} className="type-heading-60">
              {title}
            </h2>
            <p className="type-body-16 text-fg-muted lg:type-body-20 mt-20 max-w-640 lg:mt-24 lg:max-w-none">{lead}</p>
          </div>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-80 lg:grid-cols-[371fr_960fr] lg:items-start lg:gap-0">
          {card}
          <FeatureGrid features={features} />
        </div>
      </div>
    </section>
  );
}
