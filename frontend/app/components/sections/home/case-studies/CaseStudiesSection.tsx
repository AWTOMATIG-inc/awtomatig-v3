import CaseStudiesSection from "../../shared/case-studies/CaseStudiesSection";

// Home: "Selected work", the shared sticky-intro case study list with the Home copy
export default function HomeCaseStudiesSection() {
  return (
    <CaseStudiesSection
      id="case-studies"
      eyebrow="Selected work"
      title="Systems are only useful when they improve outcomes."
      description="AWTOMATIG works across web infrastructure, back-office operations, ERP systems and AdTech to turn fragmented processes into clearer, scalable workflows."
    />
  );
}
