import { Eyebrow } from "@/app/components/ui";
import WorkPathTimeline from "./WorkPathTimeline";
import { WORK_STEPS } from "./workPath";

// Campaign page: "How we work", the six-step path as an auto-advancing timeline that can also be swiped sideways
export default function HowWeWorkSection() {
  return (
    <section id="how-we-work" aria-labelledby="how-we-work-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container py-60 lg:pt-120 lg:pb-100">
        <div className="grid gap-20 lg:grid-cols-[318fr_1002fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">How we work</Eyebrow>
          <h2 id="how-we-work-title" className="type-heading-60">
            A structured path from problem
            <br className="max-lg:hidden" /> to working system.
          </h2>
        </div>

        <div className="mt-48 lg:mt-100">
          <WorkPathTimeline steps={WORK_STEPS} />
        </div>
      </div>
    </section>
  );
}
