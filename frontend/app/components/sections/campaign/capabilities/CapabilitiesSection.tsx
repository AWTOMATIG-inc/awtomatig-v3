import { Eyebrow, LinesBackground } from "@/app/components/ui";
import CapabilityList from "../../shared/capability-list/CapabilityList";
import { CAPABILITIES } from "./capabilities";
import { CAPABILITIES_LINES } from "./capabilitiesLines";

// Campaign page: "Solutions for cleaning companies", the eight areas (tabs) beside the open area's image.
// `id="service"` is the hero's "Explore the Solutions" target.
export default function CapabilitiesSection() {
  return (
    <LinesBackground preset={CAPABILITIES_LINES} id="service" aria-labelledby="capabilities-title" className="text-fg-inverse">
      <div className="site-container relative z-20 py-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-20 lg:grid-cols-[317fr_668fr_335fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">For cleaning companies</Eyebrow>
          <h2 id="capabilities-title" className="type-heading-60">
            Websites, systems, and
            <br className="max-lg:hidden" /> support for your
            <br className="max-lg:hidden" /> next stage.
          </h2>
          <p className="type-body-16 text-white/80 lg:self-end">
            Choose a focused improvement or a connected
            <br className="max-lg:hidden" /> project. We scope the work around your existing
            <br className="max-lg:hidden" /> tools, team, and operational requirements.
          </p>
        </div>

        <CapabilityList items={CAPABILITIES} />
      </div>
    </LinesBackground>
  );
}
