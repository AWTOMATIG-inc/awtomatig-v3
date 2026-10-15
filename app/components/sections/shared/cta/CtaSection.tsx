import Image from "next/image";
import type { ReactNode } from "react";
import Mark from "@/public/images/awtomatig-logo.png";
import { WhatsAppIcon } from "@/app/components/icons";
import { Button, Eyebrow, LinesBackground, TagMarquee } from "@/app/components/ui";
import { CAPABILITY_TAGS, SITE } from "@/lib/site";
import { CTA_LINES } from "./ctaLines";

type CtaAction = { label: string; href: string };

type CtaNote = { title: string; description: ReactNode };

// Desktop composition per page, measured from each screenshot. Services lines the title up with the other
// Services sections (x ≈ 420 at 1440) and uses 250px buttons.
const LAYOUTS = {
  home: { section: "lg:pt-100 lg:pb-92", eyebrow: "lg:w-359", actions: "lg:mt-40", button: "lg:w-256", note: "lg:mt-78" },
  services: { section: "lg:pt-104 lg:pb-92", eyebrow: "lg:w-372", actions: "lg:mt-36", button: "lg:w-250", note: "lg:mt-78" },
  process: { section: "lg:pt-100 lg:pb-68", eyebrow: "lg:w-367", actions: "lg:mt-36", button: "lg:w-250", note: "lg:mt-78" },
  about: { section: "lg:pt-104 lg:pb-68", eyebrow: "lg:w-330", actions: "lg:mt-36", button: "lg:w-256", note: "lg:mt-105" },
};

type CtaSectionProps = {
  id?: string;
  eyebrow?: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line break */
  title?: ReactNode;
  description?: ReactNode;
  /** Cyan button */
  primary?: CtaAction;
  /** Glass button with the WhatsApp icon; `null` hides it. Defaults to WhatsApp, hidden until SITE.whatsappUrl is set */
  secondary?: CtaAction | null;
  /** Tag strip under the buttons; `[]` hides it */
  tags?: string[];
  /** Brand mark + short note in the strip under the buttons, replacing the tags (Services and About pages) */
  note?: CtaNote;
  layout?: keyof typeof LAYOUTS;
};

/** "Let's talk" call to action on the animated lines background, shared by every page (DESIGN.md §10.4). */
export default function CtaSection({
  id = "cta",
  eyebrow = "Let’s talk",
  title = (
    <>
      Let’s build what your
      <br className="max-lg:hidden" /> business needs next.
    </>
  ),
  description = (
    <>
      Whether the challenge sits in infrastructure, operations, ERP or AdTech,
      <br className="max-lg:hidden" /> we help bring structure to the systems behind the business.
    </>
  ),
  primary = { label: "Start a conversation", href: "/contact" },
  secondary = SITE.whatsappUrl ? { label: "Message us", href: SITE.whatsappUrl } : null,
  tags = CAPABILITY_TAGS,
  note,
  layout = "home",
}: CtaSectionProps) {
  const l = LAYOUTS[layout];
  return (
    <LinesBackground preset={CTA_LINES} id={id} className={`pt-60 pb-40 ${l.section}`}>
      <div className="site-container relative z-20">
        <div className="flex flex-col gap-20 lg:flex-row lg:gap-0">
          <Eyebrow className={`text-fg-inverse self-start lg:mt-2 lg:shrink-0 ${l.eyebrow}`}>{eyebrow}</Eyebrow>

          <div>
            <h2 className="type-heading-60 text-fg-inverse">{title}</h2>
            <p className="type-body-16 text-fg-inverse mt-16 max-w-560">{description}</p>

            <div className={`mt-32 flex flex-col gap-12 sm:flex-row ${l.actions}`}>
              <Button variant="primary" size="xl" href={primary.href} className={`w-full sm:flex-1 lg:flex-none ${l.button}`}>
                {primary.label}
              </Button>
              {secondary && (
                <Button
                  variant="glass"
                  size="xl"
                  href={secondary.href}
                  icon={<WhatsAppIcon />}
                  className={`w-full sm:flex-1 lg:flex-none ${l.button}`}
                >
                  {secondary.label}
                </Button>
              )}
            </div>
          </div>
        </div>

        {note ? (
          <div
            className={`text-fg-inverse mt-40 flex items-start gap-20 border-y border-white/12 py-20 ${l.note} lg:h-100 lg:items-center lg:gap-32 lg:py-0 lg:pl-40`}
          >
            <Image src={Mark} alt="" className="h-auto w-30 shrink-0 lg:w-38" />
            <div>
              <p className="type-heading-20 lg:type-heading-24">{note.title}</p>
              <p className="type-body-14 lg:type-body-16 mt-6 lg:mt-4">{note.description}</p>
            </div>
          </div>
        ) : (
          tags.length > 0 && (
            <TagMarquee
              tags={tags}
              label="Capabilities"
              className="mt-40 border-y border-white/12 lg:mt-80"
              listClassName="type-body-16 items-center py-20 text-white/60 lg:h-72 lg:py-0"
              itemClassName="hover:text-fg-inverse pr-40 transition-colors duration-200 motion-reduce:transition-none lg:pr-60"
              durationClassName="[animation-duration:50s]"
            />
          )
        )}
      </div>
    </LinesBackground>
  );
}
