import { ArrowRightIcon } from "@/app/components/icons";
import { Button } from "@/app/components/ui";
import type { CaseStudy } from "./caseStudies";

type CaseStudyDetailsProps = {
  study: CaseStudy;
  /** Trailing → on the button (Case Studies page) */
  arrow?: boolean;
};

// Title, summary, client / service, description and "View case study": the text column of every case study card
export default function CaseStudyDetails({ study, arrow = false }: CaseStudyDetailsProps) {
  return (
    <div>
      <h3 id={`${study.id}-title`} className="type-heading-28 text-fg-strong">
        {study.title}
      </h3>
      <p className="type-body-16 mt-10 text-fg-primary">{study.summary}</p>

      <dl className="mt-30 flex gap-16">
        <div>
          <dt className="type-caption-12 text-black/60 uppercase">Client:</dt>
          <dd className="type-body-16 mt-2 font-medium text-fg-strong">{study.client}</dd>
        </div>
        <div>
          <dt className="type-caption-12 text-black/60 uppercase">Service:</dt>
          <dd className="type-body-16 mt-2 font-medium text-fg-strong">{study.service}</dd>
        </div>
      </dl>

      <p className="type-body-16 mt-28 text-fg-primary">{study.description}</p>

      <Button
        href={study.href}
        variant="light"
        size="card"
        iconEnd={arrow ? <ArrowRightIcon /> : undefined}
        aria-label={`View case study: ${study.title}`}
        className="mt-28 w-full sm:w-205"
      >
        View case study
      </Button>
    </div>
  );
}
