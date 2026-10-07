import type { ReactNode } from "react";
import { ArrowDownIcon } from "@/app/components/icons";
import { Button, Eyebrow, LinesBackground } from "@/app/components/ui";
import { HERO_LINES } from "./heroLines";

// Listed column by column: the desktop grid flows top-to-bottom in two rows
const SERVICE_AREAS = ["Website Infrastructure", "Back-Office Operations", "ERP & Business Systems", "AdTech"];

type HeroAction = { label: string; href: string };

type PageHeroProps = {
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  description: ReactNode;
  /** Cyan button with a trailing ↓, usually jumping to the first section below */
  primary: HeroAction;
  /** Glass button */
  secondary?: HeroAction;
};

/** Full-screen inner-page hero (Services, Case Studies): the home hero's background and frame scale, a gradient
 *  Display / 100 title at the top, and the intro, service areas and buttons on the bottom edge (DESIGN.md §10.4). */
export default function PageHero({
  id,
  eyebrow,
  title,
  description,
  primary,
  secondary = { label: "Start a Conversation", href: "/#contact" },
}: PageHeroProps) {
  return (
    <LinesBackground preset={HERO_LINES} id={id} className="hero flex min-h-svh flex-col">
      <div className="hero-inner site-container relative z-20 flex flex-1 flex-col pb-40 lg:pb-113">
        <Eyebrow className="text-fg-inverse">{eyebrow}</Eyebrow>

        <h1 className="type-display-100 text-gradient-display mt-24 w-fit">{title}</h1>

        <div className="mt-auto flex flex-col items-start gap-40 pt-40 lg:pt-43 lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          <p className="type-body-16 max-w-640 text-fg-inverse lg:type-body-20 lg:max-w-none">{description}</p>

          <div className="w-full lg:w-514 lg:shrink-0">
            <ul className="grid sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-2 sm:gap-x-26">
              {SERVICE_AREAS.map((area) => (
                <li key={area} className="type-body-15 flex items-center gap-12 border-b border-white/12 pt-18 pb-14 text-fg-inverse">
                  <span aria-hidden="true" className="size-5 shrink-0 rounded-full bg-action-primary" />
                  {area}
                </li>
              ))}
            </ul>

            <div className="mt-32 flex flex-col gap-12 sm:flex-row">
              <Button
                href={primary.href}
                variant="primary"
                size="lg"
                iconEnd={<ArrowDownIcon />}
                className="w-full sm:flex-1 lg:w-250 lg:flex-none"
              >
                {primary.label}
              </Button>
              <Button href={secondary.href} variant="glass" size="lg" className="w-full sm:flex-1 lg:w-252 lg:flex-none">
                {secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LinesBackground>
  );
}
