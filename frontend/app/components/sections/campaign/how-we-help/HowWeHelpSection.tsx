import { Eyebrow } from "@/app/components/ui";
import FeatureGrid from "../../shared/feature-grid/FeatureGrid";
import StackCard from "../../shared/stack-card/StackCard";
import { HELP_STEPS } from "./howWeHelp";

// Campaign page: "How we help", the People → Technology stack beside the Build / Connect / Operate / Improve card
export default function HowWeHelpSection() {
  return (
    <section id="how-we-help" aria-labelledby="how-we-help-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-20 lg:grid-cols-[371fr_960fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">How we help</Eyebrow>
          <div>
            <h2 id="how-we-help-title" className="type-heading-60">
              Start with the workflow
              <br className="max-lg:hidden" /> that needs to work better.
            </h2>
            <p className="type-body-16 mt-20 max-w-640 lg:mt-24 lg:max-w-none">
              We review the people, processes, and tools around your requirement, then agree
              <br className="max-lg:hidden" /> what to build, connect, operate, or improve.
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
