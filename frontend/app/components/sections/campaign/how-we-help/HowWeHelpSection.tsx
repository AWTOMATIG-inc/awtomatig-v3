import { Eyebrow } from "@/app/components/ui";
import FeatureGrid from "../../shared/feature-grid/FeatureGrid";
import StackCard from "../../shared/stack-card/StackCard";
import { HELP_STEPS } from "./howWeHelp";

// Campaign page: "How we help", the People → Technology stack beside the Build / Connect / Operate / Improve card
export default function HowWeHelpSection() {
  return (
    <section id="how-we-help" aria-labelledby="how-we-help-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-120 lg:pb-120">
        <div className="grid gap-20 lg:grid-cols-[371fr_960fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">How we help</Eyebrow>
          <div>
            <h2 id="how-we-help-title" className="type-heading-60">
              The right solution starts with the
              <br className="max-lg:hidden" /> right operating structure.
            </h2>
            <p className="type-body-16 mt-20 max-w-640 lg:mt-24 lg:max-w-none">
              We look at the environment around the problem — not just the individual tool or task — then define what
              <br className="max-lg:hidden" /> should be built, connected, operated and improved.
            </p>
          </div>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-56 lg:grid-cols-[371fr_960fr] lg:items-start lg:gap-0">
          <StackCard />
          <FeatureGrid features={HELP_STEPS} descriptionClassName="max-w-396" />
        </div>
      </div>
    </section>
  );
}
