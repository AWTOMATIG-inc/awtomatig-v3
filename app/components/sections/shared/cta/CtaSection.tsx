import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/app/components/icons";
import { Button, Eyebrow, LinesBackground } from "@/app/components/ui";
import { CTA_LINES } from "./ctaLines";

// Replace with your WhatsApp link, e.g. https://wa.me/<number>
const WHATSAPP_URL = "#contact";

const DEFAULT_TAGS = ["Infrastructure", "Operations", "Automation", "Integrations", "AdTech"];

type CtaAction = { label: string; href: string };

type CtaSectionProps = {
  id?: string;
  eyebrow?: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line break */
  title?: ReactNode;
  description?: ReactNode;
  /** Cyan button */
  primary?: CtaAction;
  /** Glass button with the WhatsApp icon; `null` hides it */
  secondary?: CtaAction | null;
  /** Tag strip under the buttons; `[]` hides it */
  tags?: string[];
};

/** "Let's talk" call to action on the animated lines background, shared by every page (DESIGN.md §10.4). */
export default function CtaSection({
  id = "contact",
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
  primary = { label: "Start a conversation", href: "#contact" },
  secondary = { label: "Message us", href: WHATSAPP_URL },
  tags = DEFAULT_TAGS,
}: CtaSectionProps) {
  return (
    <LinesBackground preset={CTA_LINES} id={id} className="pt-60 pb-40 lg:pt-100 lg:pb-92">
      <div className="site-container relative z-20">
        <div className="flex flex-col gap-20 lg:flex-row lg:gap-0">
          <Eyebrow className="self-start text-fg-inverse lg:mt-2 lg:w-359 lg:shrink-0">{eyebrow}</Eyebrow>

          <div>
            <h2 className="type-heading-60 text-fg-inverse">{title}</h2>
            <p className="type-body-16 mt-16 max-w-560 text-fg-inverse">{description}</p>

            <div className="mt-32 flex flex-col gap-12 sm:flex-row lg:mt-40">
              <Button
                variant="primary"
                size="xl"
                href={primary.href}
                className="w-full sm:flex-1 lg:w-256 lg:flex-none"
              >
                {primary.label}
              </Button>
              {secondary && (
                <Button
                  variant="glass"
                  size="xl"
                  href={secondary.href}
                  icon={<WhatsAppIcon />}
                  className="w-full sm:flex-1 lg:w-256 lg:flex-none"
                >
                  {secondary.label}
                </Button>
              )}
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <ul className="type-body-16 mt-40 flex flex-wrap gap-x-20 gap-y-8 border-y border-white/12 py-20 text-white/60 lg:mt-80 lg:h-72 lg:flex-nowrap lg:items-center lg:justify-between lg:px-60 lg:py-0">
            {tags.map((tag) => (
              <li key={tag} className="transition-colors duration-200 hover:text-fg-inverse motion-reduce:transition-none">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </LinesBackground>
  );
}
