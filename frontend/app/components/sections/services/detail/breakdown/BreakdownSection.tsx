import { Fragment, type ReactNode } from "react";
import { Eyebrow } from "@/app/components/ui";
import MockupStage from "../../../shared/problems/MockupStage";
import {
  DeploymentMockup,
  MaintenanceMockup,
  OutdatedMockup,
  PerformanceMockup,
  PublishingMockup,
  SystemsMockup,
} from "./mockups";

const MOCKUPS = {
  outdated: OutdatedMockup,
  performance: PerformanceMockup,
  publishing: PublishingMockup,
  systems: SystemsMockup,
  deployment: DeploymentMockup,
  maintenance: MaintenanceMockup,
};

export type BreakdownCard = {
  title: string;
  /** The description as the design breaks it: the lines are forced from `xl` up and flow as one paragraph below */
  lines: string[];
  mockup: keyof typeof MOCKUPS;
};

type BreakdownSectionProps = {
  id: string;
  /** Use a `<br />` where the design wraps the label (it sits in a narrow column) */
  eyebrow: ReactNode;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  lead: ReactNode;
  /** Six cards: three columns by two rows on desktop */
  cards: BreakdownCard[];
};

/** Service detail "Where things break down": off-white, a heading row, then six white cards, each with an animated
 *  mock-UI illustration over its title and description (the Home Operations cards' shell and stage, in three columns). */
export default function BreakdownSection({ id, eyebrow, title, lead, cards }: BreakdownSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-20 lg:grid-cols-[365fr_619fr_336fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">{eyebrow}</Eyebrow>
          <h2 id={`${id}-title`} className="type-heading-60 max-w-[8em]">
            {title}
          </h2>
          <p className="type-body-14 text-fg-muted max-w-640 self-end lg:max-w-none">{lead}</p>
        </div>

        <ul className="mt-40 grid gap-20 md:grid-cols-2 lg:mt-77 lg:grid-cols-3">
          {cards.map(({ title: cardTitle, lines, mockup }) => {
            const Mockup = MOCKUPS[mockup];
            return (
              <li key={cardTitle} className="flex">
                <article className="rounded-16 border-surface bg-surface flex w-full flex-col overflow-hidden border-3">
                  {/* A fixed 420×253 composition that shrinks with the card (mockup-scale) */}
                  <MockupStage className="bg-surface-subtle @container overflow-hidden">
                    <div aria-hidden="true" className="mockup-scale relative mx-auto h-253 w-420 select-none [--mockup-w:420]">
                      <Mockup />
                    </div>
                  </MockupStage>
                  <div className="px-20 pt-20 pb-16">
                    <h3 className="type-heading-22">{cardTitle}</h3>
                    <p className="type-body-16 text-fg-primary mt-8 xl:whitespace-nowrap">
                      {lines.map((line, n) => (
                        <Fragment key={line}>
                          {n > 0 && (
                            <>
                              <br className="max-xl:hidden" />{" "}
                            </>
                          )}
                          {line}
                        </Fragment>
                      ))}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
