import type { ReactNode } from "react";
import { Eyebrow, LinesBackground } from "@/app/components/ui";
import { CAPABILITIES_LINES } from "../../campaign/capabilities/capabilitiesLines";
import CapabilityList, { type Capability } from "../../shared/capability-list/CapabilityList";

type CapabilitiesSectionProps = {
  /** Anchor id; the hero's "Explore Capabilities" button scrolls here */
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks (three lines in the design) */
  title: ReactNode;
  lead: ReactNode;
  items: Capability[];
};

/** Service detail "Capabilities": the campaign page's dark section (animated vertical bands and lasers) with the
 *  numbered capability tabs beside the open one's image. */
export default function CapabilitiesSection({ id, eyebrow, title, lead, items }: CapabilitiesSectionProps) {
  return (
    <LinesBackground preset={CAPABILITIES_LINES} id={id} aria-labelledby={`${id}-title`} className="text-fg-inverse">
      <div className="site-container relative z-20 py-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-20 lg:grid-cols-[317fr_668fr_335fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">{eyebrow}</Eyebrow>
          <h2 id={`${id}-title`} className="type-heading-60">
            {title}
          </h2>
          <p className="type-body-16 text-white/80 lg:self-end">{lead}</p>
        </div>

        <CapabilityList items={items} />
      </div>
    </LinesBackground>
  );
}
