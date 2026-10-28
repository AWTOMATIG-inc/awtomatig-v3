import { ChatBubbleIcon } from "@/app/components/icons";
import { Button, Eyebrow } from "@/app/components/ui";
import FaqList from "./FaqList";

// Contact page: heading row, then a dark "still have questions" card beside the accordion (both start on the first hairline)
export default function FaqSection() {
  return (
    <section id="faqs" aria-labelledby="faq-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container py-60 lg:pt-100 lg:pb-100">
        <div className="grid gap-20 lg:grid-cols-[384fr_936fr] lg:gap-x-0 lg:gap-y-60">
          <Eyebrow className="self-start lg:mt-10">FAQs</Eyebrow>
          <h2 id="faq-title" className="type-heading-60">
            Before we get started.
          </h2>

          <div className="bg-logo-card rounded-12 text-fg-inverse flex min-h-275 w-full flex-col self-start p-24 pt-28 lg:max-w-280">
            <ChatBubbleIcon className="text-action-primary size-32" />
            <p className="type-heading-22 mt-20">
              Still have some
              <br /> questions left?
              <br /> Contact Us
            </p>
            <Button href="/contact#inquiry" size="xl" fullWidth className="mt-32 lg:mt-auto">
              Start a conversation
            </Button>
          </div>

          <FaqList />
        </div>
      </div>
    </section>
  );
}
