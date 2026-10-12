import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@/app/components/icons";
import { Button, Eyebrow } from "@/app/components/ui";
import CtaSection from "@/app/components/sections/shared/cta/CtaSection";
import { CASE_STUDIES } from "@/app/components/sections/shared/case-studies/caseStudies";
import { getService } from "@/lib/services";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.id }));
}

export async function generateMetadata({ params }: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const study = CASE_STUDIES.find((s) => s.id === slug);
  if (!study) return {};

  return pageMetadata({ title: study.title, description: study.summary, path: `/case-studies/${study.id}` });
}

// Demo detail page (requested 2026-10-09) so "View case study" has somewhere real to go; reuses the same case
// study data as the list, not a Figma-matched design. Swap in the real per-study content when it exists.
export default async function CaseStudyDetailPage({ params }: PageProps<"/case-studies/[slug]">) {
  const { slug } = await params;
  const study = CASE_STUDIES.find((s) => s.id === slug);
  if (!study) notFound();

  const service = getService(study.service);

  return (
    <>
      <section className="bg-surface text-fg-strong">
        <div className="site-container pt-safe-120 lg:pt-safe-160 pb-80 lg:pb-120">
          <Button
            href="/case-studies"
            variant="outline"
            size="md"
            icon={<ArrowRightIcon className="rotate-180" />}
            className="mb-32"
          >
            All case studies
          </Button>

          <Eyebrow>{service.name}</Eyebrow>
          <h1 className="type-heading-60 lg:type-display-80 mt-20 max-w-900">{study.title}</h1>
          <p className="type-body-20 text-fg-primary mt-20 max-w-640">{study.summary}</p>

          <Image
            src={study.image}
            alt={study.imageAlt}
            sizes="(min-width: 1024px) 1100px, 100vw"
            className="mt-50 h-auto w-full max-w-1100 lg:mt-60"
          />

          <div className="mt-50 grid gap-40 lg:mt-60 lg:grid-cols-2 lg:gap-60">
            <div>
              <h2 className="type-heading-24 tracking-tight">The challenge</h2>
              <p className="type-body-16 text-fg-primary mt-12">{study.challenge}</p>

              <ul aria-label="Scope" className="mt-20 flex flex-wrap gap-8">
                {study.tags.map((tag) => (
                  <li
                    key={tag}
                    className="type-caption-12 rounded-6 bg-surface-subtle text-fg-strong flex h-31 items-center px-12"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <dl className="flex gap-16">
                <div>
                  <dt className="type-caption-12 text-black/60 uppercase">Client:</dt>
                  <dd className="type-body-16 text-fg-strong mt-2 font-medium">{study.client}</dd>
                </div>
                <div>
                  <dt className="type-caption-12 text-black/60 uppercase">Service:</dt>
                  <dd className="type-body-16 text-fg-strong mt-2 font-medium">{service.name}</dd>
                </div>
              </dl>
              <p className="type-body-16 text-fg-primary mt-20">{study.description}</p>
            </div>
          </div>

          {study.stats && study.stats.length > 0 && (
            <dl className="border-border mt-50 grid grid-cols-2 border-t lg:mt-60">
              {study.stats.map((stat, i) => (
                <div
                  key={`${stat.label}-${i}`}
                  className="nth-[n+3]:border-border flex flex-col-reverse justify-end pt-26 pb-32 even:pl-24 nth-[n+3]:border-t nth-[n+3]:pb-0"
                >
                  <dt className="type-body-16-compact text-fg-muted mt-6 max-w-135">{stat.label}</dt>
                  <dd className="type-heading-50 font-normal">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
