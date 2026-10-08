import { Eyebrow } from "@/app/components/ui";
import InquiryForm from "./InquiryForm";
import { CONTACT_DETAILS } from "./inquiry";

// Contact page, after the hero: intro and contact details on the left, the project inquiry form on the right
export default function InquirySection() {
  return (
    <section id="inquiry" aria-labelledby="inquiry-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container grid gap-40 pt-40 pb-60 lg:grid-cols-[minmax(0,1fr)_739px] lg:gap-50 lg:pb-75">
        <div className="lg:pt-8">
          <Eyebrow>Trust / Proof</Eyebrow>
          <h2 id="inquiry-title" className="type-heading-60 mt-24">
            Trusted to support
            <br className="max-lg:hidden" /> the systems behind
            <br className="max-lg:hidden" /> growing businesses.
          </h2>
          <p className="type-body-16-compact mt-20 max-w-540 text-fg-primary lg:mt-26">
            Every engagement is different, but the way we approach complexity
            <br className="max-lg:hidden" /> stays structured. Each stage builds on the last, creating clarity before
            <br className="max-lg:hidden" /> execution and control throughout delivery.
          </p>

          <dl className="mt-30 max-w-531 divide-y divide-border border border-border">
            {CONTACT_DETAILS.map((item) => (
              <div key={item.label} className="p-16">
                <dt className="type-caption-12 uppercase">{item.label}</dt>
                <dd className="type-body-16 mt-10 font-medium">
                  {item.href ? (
                    <a href={item.href} className="transition-colors duration-200 hover:text-fg-strong/60 motion-reduce:transition-none">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <InquiryForm />
      </div>
    </section>
  );
}
