import CaseStudiesSection from "../../shared/case-studies/CaseStudiesSection";
import { CASE_STUDIES } from "../../shared/case-studies/caseStudies";

const CLEANING_STUDIES = CASE_STUDIES.filter((study) => study.id === "new-york-clean-team");

// Campaign page: "Relevant work", only the New York Clean Team case study (the cleaning-sector one). The supplied copy's
// project rows are placeholders until approved projects exist.
export default function ProvenCaseStudiesSection() {
  return (
    <CaseStudiesSection
      id="relevant-work"
      eyebrow="Relevant work"
      title="See how we support the work behind the business."
      paddingClassName="py-60 lg:pt-90 lg:pb-90"
      studies={CLEANING_STUDIES}
      cta={{ label: "Discuss a similar need", href: "#get-started" }}
    />
  );
}
