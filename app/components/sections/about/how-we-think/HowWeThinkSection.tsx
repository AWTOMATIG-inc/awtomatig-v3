import { Eyebrow } from "@/app/components/ui";
import FeatureGrid from "../../shared/feature-grid/FeatureGrid";
import LogoCard from "./LogoCard";
import { PRINCIPLES } from "./howWeThink";

// About page: four principles in the shared feature card, with the logo card beside them
export default function HowWeThinkSection() {
  return (
    <section id="how-we-think" aria-labelledby="how-we-think-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-61 lg:pb-71">
        <div className="grid gap-20 lg:grid-cols-[371fr_960fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">How we think</Eyebrow>
          <h2 id="how-we-think-title" className="type-heading-60">
            Good systems should make
            <br className="max-lg:hidden" /> work feel simpler.
          </h2>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-55 lg:grid-cols-[371fr_960fr] lg:items-start lg:gap-0">
          <LogoCard />
          <FeatureGrid features={PRINCIPLES} descriptionClassName="max-w-400" />
        </div>
      </div>
    </section>
  );
}
