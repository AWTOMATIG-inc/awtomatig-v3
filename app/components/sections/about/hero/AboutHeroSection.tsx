import PageHero from "../../shared/hero/PageHero";

// Listed column by column, like the service areas on the other page heroes
const FOCUS_AREAS = ["People & Teams", "Business infrastructure", "Workflows", "Tools & automation"];

// About page hero: the shared page hero with the About intro
export default function AboutHeroSection() {
  return (
    <PageHero
      id="about-hero"
      eyebrow="About AWTOMATIG"
      title={
        <>
          Meet the people who
          <br className="max-lg:hidden" /> build the systems behind
          <br className="max-lg:hidden" /> the scenes.
        </>
      }
      description={
        <>
          We help businesses turn complex operations into clear, connected, and
          <br className="max-lg:hidden" /> efficient systems that are easier to manage, easier to scale, and built
          <br className="max-lg:hidden" /> to support the way their teams work every day.
        </>
      }
      primary={{ label: "Our Story", href: "#our-story" }}
      primaryWidth="narrow"
      areas={FOCUS_AREAS}
    />
  );
}
