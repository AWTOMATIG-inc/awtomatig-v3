import { Eyebrow } from "@/app/components/ui";
import TestimonialsTrack from "./TestimonialsTrack";
import { TESTIMONIALS } from "./testimonials";

// "Client testimonials": header row (eyebrow / title / paragraph) + a draggable, autoplaying card scroller.
// Shared by Home (after Why AWTOMATIG) and About (after Culture).
export default function TestimonialsSection() {
  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container py-60 lg:pt-116 lg:pb-104">
        <div className="grid gap-20 lg:grid-cols-[340fr_606fr_381fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-5">Client testimonials</Eyebrow>
          <h2 id="testimonials-title" className="type-heading-60">
            What clients say after
            <br className="max-lg:hidden" /> the work is done.
          </h2>
          <p className="type-body-16 text-fg-muted max-w-280 self-start">
            Real feedback from teams we&apos;ve supported across infrastructure, operations and connected systems.
          </p>
        </div>

        <TestimonialsTrack testimonials={TESTIMONIALS} />
      </div>
    </section>
  );
}
