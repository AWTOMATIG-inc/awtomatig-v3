import { Eyebrow } from "@/app/components/ui";
import ProcessStepRow from "./ProcessStepRow";
import ProcessTimeline from "./ProcessTimeline";
import { PROCESS_STEPS } from "./steps";

/** "The process": heading row and the nine steps on a scroll-linked rail, off-white. The hero's "Explore the Process" target. */
export default function ProcessStepsSection() {
  return (
    <section id="process" aria-labelledby="process-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 lg:pt-116">
        <div className="grid gap-20 lg:grid-cols-[351fr_505fr_381fr] lg:gap-x-47">
          <Eyebrow className="self-start lg:mt-10">The Process</Eyebrow>
          <h2 id="process-title" className="type-heading-60">
            From problem to
            <br className="max-lg:hidden" /> working system.
          </h2>
          <p className="type-body-16-compact text-fg-primary lg:mt-12 lg:whitespace-nowrap">
            Every engagement is different, but the way we
            <br className="max-lg:hidden" /> approach complexity stays structured. Each stage
            <br className="max-lg:hidden" /> builds on the last, creating clarity before execution
            <br className="max-lg:hidden" /> and control throughout delivery.
          </p>
        </div>

        <div className="mt-40 lg:mt-77">
          <ProcessTimeline>
            {PROCESS_STEPS.map((step, i) => (
              <ProcessStepRow key={step.name} step={step} index={i} />
            ))}
          </ProcessTimeline>
        </div>
      </div>
    </section>
  );
}
