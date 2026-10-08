import IntroSection from "../../shared/intro/IntroSection";

// About page story; the hero's "Our story" scrolls here
export default function OurStorySection() {
  return (
    <IntroSection
      id="our-story"
      eyebrow="Our story"
      markPosition="high"
      title={
        <>
          Built to make complexity
          <br className="max-lg:hidden" /> easier to manage.
        </>
      }
      lead={[
        <>
          Businesses rarely struggle because they lack another tool. They struggle
          <br className="max-lg:hidden" /> when people, processes and systems don’t work together.
        </>,
        <>
          AWTOMATIG exists to solve that gap. We work across websites,
          <br className="max-lg:hidden" /> business systems, operations and technology to turn disconnected
          <br className="max-lg:hidden" /> pieces into practical, connected environments.
        </>,
        <>
          Our approach has grown around the same principle from the start:
          <br className="max-lg:hidden" /> understand how the business actually works, then build what makes it
          <br className="max-lg:hidden" /> work better.
        </>,
      ]}
    />
  );
}
