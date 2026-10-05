import Image from "next/image";
import { Button } from "@/app/components/ui";
import type { CaseStudy } from "./caseStudies";

// Showcase image on the left, details centred beside it (stacked below xl)
export default function CaseStudyCard({ study }: { study: CaseStudy }) {
  const titleId = `${study.id}-title`;

  return (
    <article aria-labelledby={titleId} className="grid gap-20 xl:grid-cols-[551fr_337fr] xl:items-center xl:gap-40">
      <Image src={study.image} alt={study.imageAlt} sizes="(min-width: 1024px) 551px, 100vw" className="h-auto w-full max-w-551" />

      <div>
        <h3 id={titleId} className="type-heading-28 text-fg-strong">
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
          aria-label={`View case study: ${study.title}`}
          className="mt-28 w-full sm:w-205"
        >
          View case study
        </Button>
      </div>
    </article>
  );
}
