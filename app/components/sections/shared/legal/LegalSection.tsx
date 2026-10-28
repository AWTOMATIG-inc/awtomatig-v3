import { Eyebrow } from "@/app/components/ui";
import type { LegalDocument } from "./legal";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** A legal page (Privacy Policy, Terms): off-white, under the light navbar, a heading and numbered sections of prose. */
export default function LegalSection({ doc }: { doc: LegalDocument }) {
  return (
    <section aria-labelledby="legal-title" className="bg-surface-subtle text-fg-strong flex-1">
      {/* Top padding clears the fixed navbar (pill bottom ≈ 64px on mobile, ≈ 80px on desktop) */}
      <div className="site-container pt-safe-120 lg:pt-safe-160 pb-60 lg:pb-120">
        <div className="max-w-720">
          <Eyebrow>{doc.eyebrow}</Eyebrow>
          <h1 id="legal-title" className="type-heading-60 mt-20">
            {doc.title}
          </h1>
          <p className="type-body-14 text-fg-muted mt-16">
            Last updated <time dateTime={doc.updated}>{DATE_FORMAT.format(new Date(doc.updated))}</time>
          </p>
          <p className="type-body-20 text-fg-primary mt-32">{doc.intro}</p>

          <ol className="border-border mt-40 border-t">
            {doc.sections.map((section, i) => (
              <li key={section.heading} className="border-border border-b py-32">
                <h2 className="type-heading-24 tracking-tight">
                  <span className="text-black/60">{String(i + 1).padStart(2, "0")}. </span>
                  {section.heading}
                </h2>
                <div className="type-body-16 text-fg-primary mt-12 space-y-12">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
