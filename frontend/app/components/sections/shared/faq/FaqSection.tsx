import type { ReactNode } from "react";
import { ChatBubbleIcon } from "@/app/components/icons";
import { Button, Eyebrow } from "@/app/components/ui";
import FaqList from "./FaqList";
import type { FaqItem } from "./faq";

type FaqSectionProps = {
  /** Questions and answers (default: the shared list) */
  items?: FaqItem[];
  eyebrow?: string;
  title?: ReactNode;
  /** The dark side card: its text (use `<br />` for the line breaks) and its button */
  /** Section padding (default: the Contact page's) */
  paddingClassName?: string;
  card?: { text: ReactNode; label: string; href: string };
};

// Heading row, then a dark "still have questions" card beside the accordion (both start on the first hairline).
// Contact and the campaign pages share it; the campaign pages pass their own copy.
export default function FaqSection({
  items,
  eyebrow = "FAQs",
  title = "Before we get started.",
  paddingClassName = "py-60 lg:pt-100 lg:pb-100",
  card = {
    text: (
      <>
        Still have some
        <br /> questions left?
        <br /> Contact Us
      </>
    ),
    label: "Start a conversation",
    href: "/contact#inquiry",
  },
}: FaqSectionProps) {
  return (
    <section id="faqs" aria-labelledby="faq-title" className="bg-surface-subtle text-fg-strong">
      <div className={`site-container ${paddingClassName}`}>
        <div className="grid gap-20 lg:grid-cols-[384fr_936fr] lg:gap-x-0 lg:gap-y-60">
          <Eyebrow className="self-start lg:mt-10">{eyebrow}</Eyebrow>
          <h2 id="faq-title" className="type-heading-60">
            {title}
          </h2>

          <div className="bg-logo-card rounded-12 text-fg-inverse flex min-h-275 w-full flex-col self-start p-24 pt-28 lg:max-w-280">
            <ChatBubbleIcon className="text-action-primary size-32" />
            <p className="type-heading-22 mt-20">{card.text}</p>
            <Button href={card.href} size="xl" fullWidth className="mt-32 lg:mt-auto">
              {card.label}
            </Button>
          </div>

          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
