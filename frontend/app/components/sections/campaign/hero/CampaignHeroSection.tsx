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
        <Eyebrow className="text-fg-inverse">Websites, systems &amp; back-office support</Eyebrow>

        <h1 className="type-display-100 text-gradient-display mt-17 w-fit md:mt-24">
          Better systems
          <br className="max-lg:hidden" /> for growing cleaning
          <br className="max-lg:hidden" /> businesses.
        </h1>

        <div className="mt-auto flex flex-col items-start gap-28 pt-40 md:gap-40 lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          <p className="type-body-fluid text-fg-inverse lg:type-body-16 max-w-640 lg:max-w-none">
            AWTOMATIG helps established cleaning companies upgrade their websites,
            <br className="max-lg:hidden" /> connect everyday workflows, and manage back-office tasks — so owners
            <br className="max-lg:hidden" /> have more control as their teams grow.
          </p>

          <div className="w-full lg:w-554 lg:shrink-0">
            <RatingBadges />

            <div className="mt-28 flex flex-col gap-10 sm:flex-row sm:gap-12 md:mt-24 lg:mt-24">
              <Button href="#service" variant="primary" size="lg" iconEnd={<ArrowDownIcon />} className="w-full sm:flex-1">
                Explore the Solutions
              </Button>
              <Button href="#get-started" variant="glass" size="lg" className="w-full sm:flex-1">
                Discuss Your Needs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LinesBackground>
  );
}
