import { ArrowDownIcon } from "@/app/components/icons";
import { Button, Eyebrow, LinesBackground } from "@/app/components/ui";
import RatingBadges from "../../home/hero/RatingBadges";
import { HERO_LINES } from "../../shared/hero/heroLines";

// SEO / campaign landing page hero: the home hero's background and frame scale, a three-line title, the intro
// bottom-left, and the rating badges over a button pair bottom-right (both 554 frame px wide)
export default function CampaignHeroSection() {
  return (
    <LinesBackground preset={HERO_LINES} id="hero" data-hero className="hero flex min-h-svh flex-col">
      <div className="hero-inner site-container relative z-20 flex flex-1 flex-col pb-40 lg:pt-140 lg:pb-113">
        <Eyebrow className="text-fg-inverse">Website infrastructure / B2B</Eyebrow>

        <h1 className="type-display-100 text-gradient-display mt-17 w-fit md:mt-24">
          Website infrastructure
          <br className="max-lg:hidden" /> for growing B2B
          <br className="max-lg:hidden" /> businesses.
        </h1>

        <div className="mt-auto flex flex-col items-start gap-28 pt-40 md:gap-40 lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          <p className="type-body-fluid text-fg-inverse lg:type-body-16 max-w-640 lg:max-w-none">
            AWTOMATIG helps growing teams build, operate and improve the
            <br className="max-lg:hidden" /> digital infrastructure behind websites, content systems and connected
            <br className="max-lg:hidden" /> business workflows.
          </p>

          <div className="w-full lg:w-554 lg:shrink-0">
            <RatingBadges />

            <div className="mt-28 flex flex-col gap-10 sm:flex-row sm:gap-12 md:mt-24 lg:mt-24">
              <Button href="#service" variant="primary" size="lg" iconEnd={<ArrowDownIcon />} className="w-full sm:flex-1">
                Explore the Service
              </Button>
              <Button href="/contact" variant="glass" size="lg" className="w-full sm:flex-1">
                Start a Conversation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LinesBackground>
  );
}
