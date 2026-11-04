import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComingSoonSection from "@/app/components/sections/shared/coming-soon/ComingSoonSection";
import { getCaseStudies, getCaseStudy } from "@/lib/caseStudies";
import { getService } from "@/lib/services";
import { pageMetadata } from "@/lib/metadata";

// Rebuilt at most once a minute, so an unpublished study returns 404 and a newly published one appears without a deploy.
// A slug that was not known at build time is rendered on first visit (dynamicParams defaults to true).
export const revalidate = 60; // must be a literal; keep equal to CASE_STUDIES_REVALIDATE_SECONDS in lib/caseStudies.ts

export async function generateStaticParams() {
  const result = await getCaseStudies();
  return result.ok ? result.studies.map((study) => ({ slug: study.id })) : [];
}

export async function generateMetadata({ params }: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCaseStudy(slug);
  if (result.status !== "ok") return {};
  const { study } = result;
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
  const result = await getCaseStudy(slug);
  if (result.status === "not-found") notFound();
  // The backend could not be reached: fail the render so Next.js keeps serving the last good page instead of caching a 404.
  if (result.status === "error") throw new Error(`Could not load the case study "${slug}"`);
  const { study } = result;

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
