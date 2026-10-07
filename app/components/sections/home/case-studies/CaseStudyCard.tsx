import Image from "next/image";
import CaseStudyDetails from "../../shared/case-studies/CaseStudyDetails";
import type { CaseStudy } from "../../shared/case-studies/caseStudies";

// Showcase image on the left, details centred beside it (stacked below xl)
export default function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <article aria-labelledby={`${study.id}-title`} className="grid gap-20 xl:grid-cols-[551fr_337fr] xl:items-center xl:gap-40">
      <Image src={study.image} alt={study.imageAlt} sizes="(min-width: 1024px) 551px, 100vw" className="h-auto w-full max-w-551" />
      <CaseStudyDetails study={study} />
    </article>
  );
}
