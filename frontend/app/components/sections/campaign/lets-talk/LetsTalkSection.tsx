import { WhatsAppIcon } from "@/app/components/icons";
import { Button, Eyebrow, LinesBackground } from "@/app/components/ui";
import { SITE } from "@/lib/site";
import LetsTalkForm from "./LetsTalkForm";
import { LETS_TALK_LINES } from "./letsTalkLines";

// Campaign page: "Let's talk", the pitch and two buttons beside a working inquiry form
export default function LetsTalkSection() {
  return (
    <LinesBackground preset={LETS_TALK_LINES} id="lets-talk" aria-labelledby="lets-talk-title" className="text-fg-inverse">
      <div className="site-container relative z-20 py-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-40 lg:grid-cols-[664fr_656fr] lg:items-start lg:gap-0">
          <div className="lg:pt-6">
            <Eyebrow>Let’s talk</Eyebrow>
            <h2 id="lets-talk-title" className="type-heading-60 mt-24">
              What would make your
              <br className="max-lg:hidden" /> cleaning business
              <br className="max-lg:hidden" /> easier to run?
            </h2>
            <p className="type-body-16 mt-16 max-w-600">
              Tell us what needs to work better — your website, enquiry handling, internal systems, or back-office workload. We
              will discuss a practical starting point.
            </p>

            <div className="mt-40 flex flex-col gap-12 sm:flex-row">
              <Button href="#get-started" variant="primary" size="lg" className="w-full sm:flex-1 lg:w-250 lg:flex-none">
                Discuss your needs
              </Button>
              {SITE.whatsappUrl && (
                <Button
                  href={SITE.whatsappUrl}
                  variant="glass"
                  size="lg"
                  icon={<WhatsAppIcon />}
                  className="w-full sm:flex-1 lg:w-252 lg:flex-none"
                >
                  Message us
                </Button>
              )}
            </div>
          </div>

          <LetsTalkForm />
        </div>
      </div>
    </LinesBackground>
  );
}
