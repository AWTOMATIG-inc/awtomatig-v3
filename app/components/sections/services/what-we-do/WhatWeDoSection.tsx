import IntroSection from "../../shared/intro/IntroSection";

// Services page intro to the four disciplines; the hero's "Explore our services" scrolls here
export default function WhatWeDoSection() {
  return (
    <IntroSection
      id="what-we-do"
      eyebrow="What we do"
      title={
        <>
          Four disciplines built
          <br className="max-lg:hidden" /> around how businesses
          <br className="max-lg:hidden" /> actually operate.
        </>
      }
      lead={
        <>
          Some challenges start with a website. Others begin inside a CRM,
          <br className="max-lg:hidden" /> ERP, campaign workflow or back-office process. We work across the
          <br className="max-lg:hidden" /> full operational environment so individual improvements connect to
          <br className="max-lg:hidden" /> the bigger picture.
        </>
      }
    />
  );
}
