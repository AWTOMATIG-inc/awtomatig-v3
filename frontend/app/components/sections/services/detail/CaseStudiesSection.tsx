import { getCaseStudies } from "@/lib/caseStudies";
import CaseStudiesSection from "../../shared/case-studies/CaseStudiesSection";

// Service detail pages: "Selected work", the shared sticky-intro case study list with the published case studies (the same
// list as Home; each page passes its own paragraph). Every section of a service detail page has 90px above and below on
// desktop (the owner asked for one rhythm).
export default async function ServiceCaseStudiesSection({ description }: { description: string }) {
  const result = await getCaseStudies();

  return (
    <CaseStudiesSection
      id="case-studies"
      eyebrow="Selected work"
      title="Systems are only useful when they improve outcomes."
      description={description}
      studies={result.ok ? result.studies : []}
      paddingClassName="pt-60 pb-60 lg:pt-90 lg:pb-90"
    />
  );
}
