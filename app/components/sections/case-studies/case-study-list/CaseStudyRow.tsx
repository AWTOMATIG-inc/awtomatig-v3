import Image from "next/image";
import CaseStudyDetails from "../../shared/case-studies/CaseStudyDetails";
import type { CaseStudy } from "../../shared/case-studies/caseStudies";

// Case Studies page card: challenge, tags and results on the left, the showcase in the middle, details on the right.
// Below xl the image comes first, then the two text columns side by side (stacked on phones).
export default function CaseStudyRow({ study }: { study: CaseStudy }) {
  return (
    <article
      aria-labelledby={`${study.id}-title`}
      className="grid gap-32 md:grid-cols-2 md:gap-x-40 xl:grid-cols-[336fr_551fr_336fr] xl:items-center xl:gap-x-50"
    >
      <Image
        src={study.image}
        alt={study.imageAlt}
        sizes="(min-width: 1024px) 551px, 100vw"
        className="-order-1 h-auto w-full max-w-551 md:col-span-2 xl:order-none xl:col-span-1 xl:col-start-2 xl:row-start-1"
      />

      <div className="xl:col-start-1 xl:row-start-1">
        <p className="type-heading-20 text-fg-strong tracking-tight">{study.challenge}</p>

        <ul aria-label="Scope" className="mt-20 flex flex-wrap gap-8">
          {study.tags.map((tag) => (
            <li key={tag} className="type-caption-12 rounded-6 bg-surface text-fg-strong flex h-31 items-center px-12">
              {tag}
            </li>
          ))}
        </ul>

        {/* No column gap, so the hairline between the rows runs across the panel */}
        {study.stats && study.stats.length > 0 && (
          <dl className="border-border mt-38 grid grid-cols-2 border-t">
            {study.stats.map((stat, i) => (
              <div
                key={`${stat.label}-${i}`}
                className="nth-[n+3]:border-border flex flex-col-reverse justify-end pt-26 pb-32 even:pl-24 nth-[n+3]:border-t nth-[n+3]:pb-0"
              >
                <dt className="type-body-16-compact text-fg-muted mt-6 max-w-135">{stat.label}</dt>
                <dd className="type-heading-50 text-fg-strong font-normal">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="xl:col-start-3 xl:row-start-1">
        <CaseStudyDetails study={study} arrow />
      </div>
    </article>
  );
}
