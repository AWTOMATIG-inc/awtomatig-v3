import PageHero from "../../shared/hero/PageHero";

// Services page hero: the shared page hero with the services intro
export default function ServicesHeroSection() {
  return (
    <PageHero
      id="services-hero"
      eyebrow="Services"
      title={
        <>
          The systems, operations
          <br className="max-lg:hidden" /> and technology behind
          <br className="max-lg:hidden" /> your business.
        </>
      }
      description={
        <>
          AWTOMATIG works across digital infrastructure, operational support,
          <br className="max-lg:hidden" /> business systems and AdTech to help businesses build stronger foundations,
          <br className="max-lg:hidden" /> reduce operational friction and keep critical workflows moving.
        </>
      }
      primary={{ label: "Explore Our Services", href: "#what-we-do" }}
    />
  );
}
