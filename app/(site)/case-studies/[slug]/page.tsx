import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComingSoonSection from "@/app/components/sections/shared/coming-soon/ComingSoonSection";
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
  return {
    ...pageMetadata({
      title: `${study.title}: Case Study Coming Soon`,
      description: `The full ${study.title} case study is coming soon. Read the summary on our case studies page or get in touch to talk about your project.`,
      path: `/case-studies/${study.id}`,
    }),
  };
}

// Every case study detail page shows "Coming soon" (requested 2026-10-20) until the real write-ups exist.
export default async function CaseStudyDetailPage({ params }: PageProps<"/case-studies/[slug]">) {
  const { slug } = await params;
  const study = CASE_STUDIES.find((s) => s.id === slug);
  if (!study) notFound();

  return (
    <ComingSoonSection
      id="case-study"
      eyebrow={getService(study.service).name}
      status="Case study in progress"
      title={
        <>
          The full story
          <br className="max-lg:hidden" /> is coming soon.
        </>
      }
      description={`We are putting together the complete ${study.title} case study. In the meantime, tell us what you are working on.`}
      secondary={{ label: "All case studies", href: "/case-studies" }}
    />
  );
}
