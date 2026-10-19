import PageHero from "../../shared/hero/PageHero";

// Case Studies page hero: the shared page hero with the case studies intro
export default function CaseStudiesHeroSection() {
  return (
    <PageHero
      id="case-studies-hero"
      eyebrow="Case Studies"
      title={
        <>
          The work matters.
          <br className="max-lg:hidden" /> What changed
          <br className="max-lg:hidden" /> matters more.
        </>
      }
      description={
        <>
          See how AWTOMATIG helps businesses improve website infrastructure,
          <br className="max-lg:hidden" /> streamline back-office operations, connect ERP systems and strengthen
          <br className="max-lg:hidden" /> workflows behind everyday execution.
        </>
      }
      primary={{ label: "See Our Work", href: "#work" }}
    />
  );
}
