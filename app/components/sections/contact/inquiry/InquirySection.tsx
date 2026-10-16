import { Eyebrow } from "@/app/components/ui";
import { SITE } from "@/lib/site";
import InquiryForm from "./InquiryForm";
import { CONTACT_DETAILS } from "./inquiry";

// Contact page, after the hero: intro and contact details on the left, the project inquiry form on the right
export default function InquirySection() {
  return (
    <section id="inquiry" aria-labelledby="inquiry-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container grid gap-40 pt-40 pb-60 lg:grid-cols-[minmax(0,1fr)_739px] lg:gap-50 lg:pb-75">
        <div className="flex flex-col lg:pt-8">
          <Eyebrow>Trust / Proof</Eyebrow>
          <h2 id="inquiry-title" className="type-heading-60 mt-24">
            Trusted to support
            <br className="max-lg:hidden" /> the systems behind
            <br className="max-lg:hidden" /> growing businesses.
          </h2>
          <p className="type-body-16-compact text-fg-primary mt-20 max-w-540 lg:mt-26">
            Every engagement is different, but the way we approach complexity
            <br className="max-lg:hidden" /> stays structured. Each stage builds on the last, creating clarity before
            <br className="max-lg:hidden" /> execution and control throughout delivery.
          </p>

          <dl className="divide-border border-border mt-30 max-w-531 divide-y border">
            {CONTACT_DETAILS.map((item) => (
              <div key={item.label} className="p-16">
                <dt className="type-caption-12 uppercase">{item.label}</dt>
                <dd className="type-body-16 mt-10 font-medium">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-fg-strong/60 transition-colors duration-200 motion-reduce:transition-none"
                    >
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {SITE.mapEmbedUrl && (
            <iframe
              src={SITE.mapEmbedUrl}
              title="AWTOMATIG office on Google Maps"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="border-border mt-30 h-300 w-full max-w-531 border lg:min-h-300 lg:flex-1"
            />
          )}
        </div>

        <InquiryForm />
      </div>
    </section>
  );
}
