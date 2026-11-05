import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Button, Eyebrow, LinesBackground } from "@/app/components/ui";
import { CONTACT_LINES } from "../../contact/hero/contactLines";

type HeroAction = { label: string; href: string };

type ServiceDetailHeroProps = {
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  description: ReactNode;
  /** Cyan button */
  primary: HeroAction;
  /** White (`light`) button */
  secondary: HeroAction;
  /** Showcase collage along the bottom edge; a transparent PNG so the hero's bars show through */
  image: StaticImageData;
};

/** Service detail page hero: the light page hero (off-white, faint animated bars, light navbar) with the title at the
 *  top-left, the intro and two buttons on the right, and a full-bleed showcase image flush with the bottom edge.
 *  The page's route must be in `SITE.lightRoutes` for the light navbar. Frame-scaled from lg up (`.hero` / `.hero-inner`). */
export default function ServiceDetailHero({
  id,
  eyebrow,
  title,
  description,
  primary,
  secondary,
  image,
}: ServiceDetailHeroProps) {
  return (
    <LinesBackground
      preset={CONTACT_LINES}
      id={id}
      aria-labelledby={`${id}-title`}
      data-hero
      className="hero text-fg-strong flex flex-col overflow-hidden"
    >
      <div className="hero-inner site-container relative z-20 flex flex-col lg:pt-160">
        <Eyebrow className="text-fg-strong">{eyebrow}</Eyebrow>

        <div className="mt-24 flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          <h1 id={`${id}-title`} className="type-display-100">
            {title}
          </h1>

          <div className="w-full lg:w-554 lg:shrink-0">
            <p className="type-body-16 text-fg-primary lg:type-body-20 max-w-640 lg:max-w-none">{description}</p>

            <div className="mt-28 flex flex-col gap-10 sm:flex-row sm:gap-12 lg:mt-32">
              <Button href={primary.href} variant="primary" size="lg" className="w-full sm:flex-1">
                {primary.label}
              </Button>
              <Button href={secondary.href} variant="light" size="lg" className="w-full sm:flex-1">
                {secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Wider than the screen on phones so the cards stay readable (cropped evenly at both sides); full width from md up */}
      <div className="relative z-10 mt-48 flex justify-center overflow-hidden md:mt-64 lg:mt-100">
        <Image
          src={image}
          alt="Examples of websites AWTOMATIG has built"
          priority
          sizes="(max-width: 767px) 190vw, 100vw"
          className="block h-auto w-[190%] max-w-none md:w-full"
        />
      </div>
    </LinesBackground>
  );
}
