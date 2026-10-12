import { Button, Eyebrow } from "@/app/components/ui";
import { CAPABILITY_TAGS } from "@/lib/site";
import RatingBadges from "./RatingBadges";

export default function HeroContent() {
  return (
    <div className="hero-inner site-container relative z-20 flex flex-1 flex-col pb-40 lg:pt-140 lg:pb-80">
      <div>
        <Eyebrow className="text-fg-inverse">Build the systems.</Eyebrow>

        <h1 className="type-display-100 text-gradient-display mt-24 w-fit">
          The operational
          <br className="max-lg:hidden" /> layer behind modern
          <br className="max-lg:hidden" /> businesses.
        </h1>
      </div>

      <div className="mt-auto pt-40">
        <div className="flex flex-col items-start gap-40 lg:flex-row lg:items-end lg:justify-between">
          <p className="type-body-16 text-fg-inverse lg:type-body-20 max-w-640 lg:max-w-720">
            From websites and back-office operations to ERP systems, automation,
            <br className="max-lg:hidden" /> and AdTech workflows, AWTOMATIG connects people, process, systems,
            <br className="max-lg:hidden" /> and technology into one scalable ecosystem.
          </p>

          <div className="w-full lg:w-auto">
            <RatingBadges />

            <div className="mt-24 flex flex-col gap-12 sm:flex-row lg:mt-31">
              <Button href="/services" variant="primary" size="lg" className="w-full sm:flex-1 lg:w-250 lg:flex-none">
                Explore Our Services
              </Button>
              <Button href="/contact" variant="glass" size="lg" className="w-full sm:flex-1 lg:w-252 lg:flex-none">
                Start a Conversation
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-40 flex flex-col items-start gap-12 border-y border-white/12 py-20 lg:mt-60 lg:h-102 lg:flex-row lg:items-center lg:justify-between lg:gap-24 lg:py-0">
          <p className="type-heading-18 text-fg-inverse lg:type-heading-20">Built for the systems behind the business.</p>
          <ul className="type-body-16 flex flex-wrap gap-x-20 gap-y-8 text-white/60 lg:flex-nowrap lg:gap-26">
            {CAPABILITY_TAGS.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
