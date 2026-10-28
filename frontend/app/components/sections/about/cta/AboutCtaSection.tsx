import CtaSection from "../../shared/cta/CtaSection";

// About page call to action: the shared CTA with the About copy and the "Start with the problem" note
export default function AboutCtaSection() {
  return (
    <CtaSection
      layout="about"
      eyebrow="Work with us"
      title={
        <>
          Have something that needs
          <br className="max-lg:hidden" /> to work better?
        </>
      }
      description="Tell us what’s getting stuck and we’ll help map the right direction."
      note={{
        title: "Start with the problem.",
        description: "You don’t need to know the exact solution yet. Tell us what needs to work better.",
      }}
    />
  );
}
