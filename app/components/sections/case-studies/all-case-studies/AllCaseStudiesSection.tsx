import IntroSection from "../../shared/intro/IntroSection";

// Case Studies page intro; the hero's "Explore our work" scrolls here
export default function AllCaseStudiesSection() {
  return (
    <IntroSection
      id="work"
      eyebrow="All case studies"
      title={
        <>
          Different problems.
          <br className="max-lg:hidden" /> Different systems.
          <br className="max-lg:hidden" /> Measurable outcomes.
        </>
      }
      lead={
        <>
          From websites and operational workflows to ERP environments
          <br className="max-lg:hidden" /> and advertising infrastructure, each engagement starts with a
          <br className="max-lg:hidden" /> different challenge - but the goal stays the same: make the
          <br className="max-lg:hidden" /> business work better.
        </>
      }
    />
  );
}
