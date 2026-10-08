import { Eyebrow } from "@/app/components/ui";
import FeatureGrid from "../../shared/feature-grid/FeatureGrid";
import StackCard from "./StackCard";
import { AREAS } from "./ecosystem";

// Services page: how the four disciplines connect, with the People → Technology stack beside them
export default function EcosystemSection() {
  return (
    <section id="ecosystem" aria-labelledby="ecosystem-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-119 lg:pb-68">
        <div className="grid gap-20 lg:grid-cols-[371fr_960fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">One operating ecosystem</Eyebrow>
          <div>
            <h2 id="ecosystem-title" className="type-heading-60">
              Your systems don’t operate
              <br className="max-lg:hidden" /> independently. Neither do
              <br className="max-lg:hidden" /> our services.
            </h2>
            <p className="type-body-16 mt-20 max-w-640 lg:mt-16 lg:max-w-none">
              A website can feed a CRM. A CRM can trigger automation. ERP can connect finance
              <br className="max-lg:hidden" /> and operations. Advertising activity can feed reporting and customer systems. The
              <br className="max-lg:hidden" /> value is in how those pieces work together.
            </p>
          </div>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-56 lg:grid-cols-[371fr_960fr] lg:items-start lg:gap-0">
          <StackCard />
          <FeatureGrid features={AREAS} />
        </div>
      </div>
    </section>
  );
}
