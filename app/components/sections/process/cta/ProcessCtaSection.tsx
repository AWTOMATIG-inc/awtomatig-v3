import CtaSection from "../../shared/cta/CtaSection";

// Process page call to action: the shared CTA with the Process copy and the "Not sure which service fits?" note
export default function ProcessCtaSection() {
  return (
    <CtaSection
      layout="process"
      title={
        <>
          What needs to
          <br className="max-lg:hidden" /> work better?
        </>
      }
      description={
        <>
          Tell us what’s getting stuck, and we’ll help map the
          <br className="max-lg:hidden" /> right direction.
        </>
      }
      note={{
        title: "Not sure which service fits?",
        description:
          "Start with the problem. We’ll help identify whether the answer sits in infrastructure, operations, business systems, AdTech or across several of them.",
      }}
    />
  );
}
