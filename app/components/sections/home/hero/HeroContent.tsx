import { Button, Eyebrow } from "@/app/components/ui";
import { CAPABILITY_TAGS } from "@/lib/site";
import RatingBadges from "./RatingBadges";

export default function HeroContent() {
  return (
    <div className="hero-inner site-container relative z-20 flex flex-1 flex-col pb-40 lg:pt-140 lg:pb-80">
      <div>
        <Eyebrow size="sm" className="text-fg-inverse">
          Build the systems.
        </Eyebrow>

        <h1 className="type-display-100 text-gradient-display mt-17 w-fit md:mt-24">
          The operational
          <br className="max-lg:hidden" /> layer behind modern
          <br className="max-lg:hidden" /> businesses.
        </h1>
      </div>

      <div className="mt-auto pt-18 md:pt-40">
        <div className="flex flex-col items-start gap-28 md:gap-40 lg:flex-row lg:items-end lg:justify-between">
          <p className="type-body-fluid text-fg-inverse lg:type-body-20 max-w-640 lg:max-w-720">
            From websites and back-office operations to ERP systems, automation,
            <br className="max-lg:hidden" /> and AdTech workflows, AWTOMATIG connects people, process, systems,
            <br className="max-lg:hidden" /> and technology into one scalable ecosystem.
          </p>

          <div className="w-full lg:w-auto">
            {/* The phone design has no rating badges */}
            <div className="max-md:hidden">
              <RatingBadges />
            </div>

            <div className="flex flex-col gap-10 sm:flex-row sm:gap-12 md:mt-24 lg:mt-31">
              <Button href="/services" variant="primary" size="lg" className="w-full sm:flex-1 lg:w-250 lg:flex-none">
                Explore Our Services
              </Button>
              <Button href="/contact" variant="glass" size="lg" className="w-full sm:flex-1 lg:w-252 lg:flex-none">
                Start a Conversation
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-28 flex flex-col items-start gap-20 border-y border-white/12 pt-22 pb-20 md:mt-40 md:gap-12 md:py-20 lg:mt-60 lg:h-102 lg:flex-row lg:items-center lg:justify-between lg:gap-24 lg:py-0">
          <p className="type-heading-15 md:type-heading-18 text-fg-inverse lg:type-heading-20">
            Built for the systems behind the business.
          </p>
          {/* Infinite slider: two identical groups, the track slides left by one group and loops (animate-marquee) */}
          <div className="fade-x w-full min-w-0 overflow-hidden motion-reduce:[mask-image:none] lg:max-w-520 lg:flex-1">
            <div
              aria-label="Capabilities"
              className="animate-marquee flex w-max [animation-duration:20s] hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none"
            >
              {[0, 1].map((copy) => (
                <ul
                  key={copy}
                  aria-hidden={copy === 1 || undefined}
                  className="type-body-12 md:type-body-16 flex shrink-0 text-white/60 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-8 motion-reduce:[&:nth-child(2)]:hidden"
                >
                  {CAPABILITY_TAGS.map((tag) => (
                    <li key={tag} className="shrink-0 pr-25 whitespace-nowrap md:pr-20 lg:pr-26">
                      {tag}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
