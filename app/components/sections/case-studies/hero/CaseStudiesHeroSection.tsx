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
          Explore how AWTOMATIG helps businesses improve digital infrastructure,
          <br className="max-lg:hidden" /> streamline operations, connect systems and strengthen the workflows
          <br className="max-lg:hidden" /> behind everyday execution.
        </>
      }
      primary={{ label: "Explore Our Work", href: "#work" }}
    />
  );
}
