import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/app/components/icons";
import { Button, Eyebrow, LinesBackground, Reveal } from "@/app/components/ui";
import { HERO_LINES, HERO_LINES_COMPACT } from "../hero/heroLines";

type ComingSoonAction = { label: string; href: string };

type ComingSoonSectionProps = {
  id?: string;
  eyebrow?: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title?: ReactNode;
  description?: ReactNode;
  /** Short status chip above the title */
  status?: string;
  /** What to expect: short lines listed beside the buttons; `[]` hides the list */
  items?: string[];
  /** Cyan button; defaults to "Start a conversation" → /contact */
  primary?: ComingSoonAction;
  /** Glass button; defaults to "Back to home" → /; `null` hides it */
  secondary?: ComingSoonAction | null;
};

/** Full-screen "Coming soon" section on the hero's animated background, for any page or block that is not ready
 *  yet (DESIGN.md §10.4). Every text, list item and button is a prop. */
export default function ComingSoonSection({
  id = "coming-soon",
  eyebrow = "Coming soon",
  title = (
    <>
      Something good
      <br className="max-lg:hidden" /> is on its way.
    </>
  ),
  description = "We are still building this part of the site. Tell us what you need and we will get back to you directly.",
  status = "In progress",
  items = [],
  primary = { label: "Start a conversation", href: "/contact" },
  secondary = { label: "Back to home", href: "/" },
}: ComingSoonSectionProps) {
  return (
    <LinesBackground preset={HERO_LINES} compact={HERO_LINES_COMPACT} id={id} data-hero className="hero flex min-h-svh flex-col">
      <div className="hero-inner site-container relative z-20 flex flex-1 flex-col pb-40 lg:pb-113">

        <div className="my-auto py-40 lg:py-60">

          <Reveal delay={100}>
            <h1 className="type-display-100 text-gradient-display mt-24 w-fit">{title}</h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="type-body-16 text-fg-inverse lg:type-body-20 mt-24 max-w-560 lg:max-w-640">{description}</p>
          </Reveal>

          <Reveal delay={300} className="mt-32 flex flex-col gap-12 sm:flex-row">
            <Button
              href={primary.href}
              variant="primary"
              size="lg"
              iconEnd={<ArrowRightIcon />}
              className="w-full sm:w-auto lg:w-250"
            >
              {primary.label}
            </Button>
            {secondary && (
              <Button href={secondary.href} variant="glass" size="lg" className="w-full sm:w-auto lg:w-252">
                {secondary.label}
              </Button>
            )}
          </Reveal>
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/12 pt-20 lg:pt-24">
            <p className="type-label-14 text-white/60 uppercase">What to expect</p>
            <ul className="mt-12 grid gap-x-26 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <li key={item} className="type-body-15 text-fg-inverse flex items-center gap-12 border-b border-white/12 py-12">
                  <span aria-hidden="true" className="bg-action-primary size-5 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </LinesBackground>
  );
}
