import PageHero from "../../shared/hero/PageHero";

// Services page hero: the shared page hero with the services intro
export default function ServicesHeroSection() {
  return (
    <PageHero
      id="services-hero"
      eyebrow="Services"
      title={
        <>
          Automation, ERP and web
          <br className="max-lg:hidden" /> systems behind your
          <br className="max-lg:hidden" /> daily operations.
        </>
      }
      description={
        <>
          AWTOMATIG works across website development, back-office operations,
          <br className="max-lg:hidden" /> ERP and business systems and AdTech to help businesses build stronger
          <br className="max-lg:hidden" /> foundations, reduce friction and keep critical workflows moving.
        </>
      }
      primary={{ label: "View Our Services", href: "#what-we-do" }}
    />
  );
}
