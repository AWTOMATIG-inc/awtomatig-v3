import { Eyebrow } from "@/app/components/ui";
import { getTestimonials } from "@/lib/testimonials";
import TestimonialsTrack from "./TestimonialsTrack";

// "Client testimonials": header row (eyebrow / title / paragraph) + a draggable, autoplaying card scroller.
// Shared by Home (after Why AWTOMATIG) and About (after Culture). The cards are the published testimonials from the CMS; the
// heading and paragraph are page copy and stay here. With nothing to show (none published, or the backend cannot be reached and
// nothing was loaded before) the whole section is left out: an empty "What clients say" box would look worse than no section.
export default async function TestimonialsSection() {
  const result = await getTestimonials();
  if (!result.ok || result.testimonials.length === 0) return null;

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

        <TestimonialsTrack testimonials={result.testimonials} />
      </div>
    </section>
  );
}
