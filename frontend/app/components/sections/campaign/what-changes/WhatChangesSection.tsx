import { Eyebrow, LinesBackground } from "@/app/components/ui";
import FeatureGrid from "../../shared/feature-grid/FeatureGrid";
import OutcomeCard from "../../shared/outcome-card/OutcomeCard";
import { OUTCOMES } from "./whatChanges";
import { WHAT_CHANGES_LINES } from "./whatChangesLines";

// Campaign page: "What changes", the business outcome card (the Trusted operations card's cyan glow) beside the 2×2 outcomes card
export default function WhatChangesSection() {
  return (
    <LinesBackground
      preset={WHAT_CHANGES_LINES}
      id="what-changes"
      aria-labelledby="what-changes-title"
      className="text-fg-inverse"
    >
      <div className="site-container relative z-20 py-60 lg:pt-116 lg:pb-116">
        <div className="grid gap-20 lg:grid-cols-[371fr_960fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">What changes</Eyebrow>
          <h2 id="what-changes-title" className="type-heading-60">
            Less friction. More control
            <br className="max-lg:hidden" /> over the operation.
          </h2>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-80 lg:grid-cols-[586fr_722fr]">
          <OutcomeCard
            className="p-24 lg:p-36"
            title={
              <>
                A stronger operating
                <br className="max-lg:hidden" /> foundation makes everyday
                <br className="max-lg:hidden" /> work easier to run and
                <br className="max-lg:hidden" /> easier to scale.
              </>
            }
            description={
              <>
                The goal is not more technology. It is a cleaner
                <br className="max-lg:hidden" /> relationship between the people, processes and systems
                <br className="max-lg:hidden" /> already carrying the work.
              </>
            }
          />

          <FeatureGrid features={OUTCOMES} descriptionClassName="max-w-285 tracking-tight" />
        </div>
      </div>
    </LinesBackground>
  );
}
