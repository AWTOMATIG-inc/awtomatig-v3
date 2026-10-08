import PageHero from "../../shared/hero/PageHero";

// Process page hero: the shared page hero with the process intro
export default function ProcessHeroSection() {
  return (
    <PageHero
      id="process-hero"
      eyebrow="How we work"
      title={
        <>
          Complex <span className="text-cyan-pale">work</span>
          <br className="max-lg:hidden" /> needs a clear
          <br className="max-lg:hidden" /> process.
        </>
      }
      description={
        <>
          From understanding the problem to implementation and ongoing
          <br className="max-lg:hidden" /> support, AWTOMATIG follows a structured process that keeps people,
          <br className="max-lg:hidden" /> workflows, systems and technology aligned throughout delivery.
        </>
      }
      primary={{ label: "Explore the Process", href: "#process" }}
    />
  );
}
