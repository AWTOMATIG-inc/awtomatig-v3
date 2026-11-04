import { getCaseStudies } from "@/lib/caseStudies";
import CaseStudiesSection from "../../shared/case-studies/CaseStudiesSection";

// Campaign page: "Relevant work", only the New York Clean Team case study (the cleaning-sector one). The supplied copy's
// project rows are placeholders until approved projects exist. Left out while that study is unpublished or cannot be loaded.
export default async function ProvenCaseStudiesSection() {
  const result = await getCaseStudies();
  const studies = result.ok ? result.studies.filter((study) => study.id === "new-york-clean-team") : [];
  if (studies.length === 0) return null;

  return (
    <CaseStudiesSection
      id="relevant-work"
      eyebrow="Relevant work"
      title="See how we support the work behind the business."
      paddingClassName="py-60 lg:pt-90 lg:pb-90"
      studies={studies}
      cta={{ label: "Discuss a similar need", href: "#get-started" }}
    />
  );
}
