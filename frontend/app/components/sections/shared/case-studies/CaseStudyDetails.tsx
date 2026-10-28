import { ArrowRightIcon } from "@/app/components/icons";
import { Button } from "@/app/components/ui";
import { getService } from "@/lib/services";
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
      <p className="type-body-16 text-fg-primary mt-10">{study.summary}</p>

      <dl className="mt-30 flex gap-16">
        <div>
          <dt className="type-caption-12 text-black/60 uppercase">Client:</dt>
          <dd className="type-body-16 text-fg-strong mt-2 font-medium">{study.client}</dd>
        </div>
        <div>
          <dt className="type-caption-12 text-black/60 uppercase">Service:</dt>
          <dd className="type-body-16 text-fg-strong mt-2 font-medium">{getService(study.service).name}</dd>
        </div>
      </dl>

      <p className="type-body-16 text-fg-primary mt-28">{study.description}</p>

      {study.href && (
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
      )}
    </div>
  );
}
