import type { Problem } from "./operations";
import SystemsMockup from "./SystemsMockup";
import OwnershipMockup from "./OwnershipMockup";
import VisibilityMockup from "./VisibilityMockup";
import WorkflowsMockup from "./WorkflowsMockup";

const MOCKUPS = {
  systems: SystemsMockup,
  visibility: VisibilityMockup,
  workflows: WorkflowsMockup,
  ownership: OwnershipMockup,
};

export default function ProblemCard({ problem }: { problem: Problem }) {
  const Mockup = MOCKUPS[problem.mockup];

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-16 border-3 border-surface bg-surface">
      {/* Illustration: a fixed 309×253 composition that shrinks with the card (mockup-scale) */}
      <div aria-hidden="true" className="@container bg-surface-subtle">
        <div className="mockup-scale relative mx-auto h-253 w-309 select-none [--mockup-w:309]">
          <Mockup />
        </div>
      </div>
      <div className="px-20 pt-20 pb-16">
        <h3 className="type-heading-22">{problem.title}</h3>
        <p className="type-body-16 mt-8 max-w-268 text-fg-primary">{problem.description}</p>
      </div>
    </article>
  );
}
