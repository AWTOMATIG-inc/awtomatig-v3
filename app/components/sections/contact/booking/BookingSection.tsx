import { Button, Eyebrow, LinesBackground } from "@/app/components/ui";
import { SITE } from "@/lib/site";
import CalendlyEmbed from "./CalendlyEmbed";
import { BOOKING_LINES } from "./bookingLines";

// Contact: "Book a discovery call instead", a Calendly discovery-call scheduler on the dark lines backdrop (last section)
export default function BookingSection() {
  if (!SITE.calendlyUrl) return null;

  return (
    <LinesBackground preset={BOOKING_LINES} id="book-a-call" aria-labelledby="booking-title" className="text-fg-inverse">
      <div className="site-container relative z-20 py-60 lg:pt-100 lg:pb-100">
        <div className="grid gap-20 lg:grid-cols-[333fr_654fr_344fr] lg:gap-x-0 lg:gap-y-64">
          <Eyebrow className="self-start lg:mt-6">Prefer to talk?</Eyebrow>
          <h2 id="booking-title" className="type-heading-60 text-gradient-display">
            Book a discovery
            <br className="max-lg:hidden" /> call instead.
          </h2>
          <p className="type-body-14 max-w-380 text-white/60 lg:self-start lg:justify-self-start lg:pt-12">
            If it’s easier to explain the problem live, choose a time that works and walk us through what you’re trying to solve.
          </p>

          <div className="lg:pr-60">
            <Button variant="primary" size="lg" href="#book-a-call-scheduler" fullWidth>
              Book a call
            </Button>
          </div>

          <div id="book-a-call-scheduler" className="rounded-16 scroll-mt-100 bg-white p-16 lg:col-span-2 lg:max-w-1320 lg:p-24">
            <div className="flex flex-wrap items-baseline justify-between gap-x-20 gap-y-4 pb-16">
              <h3 className="type-heading-28 text-fg-strong">Choose a time</h3>
              <p className="type-caption-12 text-fg-strong uppercase">30 min / Discovery call</p>
            </div>
            <CalendlyEmbed url={SITE.calendlyUrl} />
          </div>
        </div>
      </div>
    </LinesBackground>
  );
}
