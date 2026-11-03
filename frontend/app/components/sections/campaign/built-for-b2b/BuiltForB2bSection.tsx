import { Fragment } from "react";
import { Eyebrow } from "@/app/components/ui";
import OutcomeCard from "../../shared/outcome-card/OutcomeCard";
import { B2B_POINTS } from "./builtForB2b";

// Campaign page: "Built for B2B", the outcome card beside a white card of three numbered points
export default function BuiltForB2bSection() {
  return (
    <section id="built-for-b2b" aria-labelledby="built-for-b2b-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container py-60 lg:pt-120 lg:pb-120">
        <div className="grid gap-20 lg:grid-cols-[305fr_1015fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">Built for B2B</Eyebrow>
          <h2 id="built-for-b2b-title" className="type-heading-60">
            Infrastructure shaped
            <br className="max-lg:hidden" /> around how growing B2B
            <br className="max-lg:hidden" /> teams actually work.
          </h2>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-64 lg:grid-cols-[645fr_658fr]">
          <OutcomeCard
            className="p-24 lg:px-28 lg:pt-28 lg:pb-20"
            descriptionClassName="type-body-16 max-w-535"
            title={
              <>
                Growth creates more systems,
                <br className="max-lg:hidden" /> more dependencies and more
                <br className="max-lg:hidden" /> pressure on the platform.
              </>
            }
            description="B2B websites increasingly sit between marketing, sales, customer journeys, internal content teams and connected systems. The infrastructure needs to support that wider operating environment, not just the front end."
          />

          <ol className="rounded-16 bg-surface px-24 py-8 lg:px-36 lg:py-20">
            {B2B_POINTS.map((point, i) => (
              <li key={point.title} className="not-last:border-surface-subtle flex gap-16 py-20 not-last:border-b lg:gap-0">
                <span className="type-heading-24 w-36 shrink-0 font-normal tracking-tight text-black/40 lg:w-52">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                <div>
                  <h3 className="type-heading-24 tracking-tight">{point.title}</h3>
                  <p className="type-body-16 text-fg-muted mt-6">
                    {point.lines.map((line, n) => (
                      <Fragment key={line}>
                        {n > 0 && (
                          <>
                            <br className="max-[1399px]:hidden" />{" "}
                          </>
                        )}
                        {line}
                      </Fragment>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
