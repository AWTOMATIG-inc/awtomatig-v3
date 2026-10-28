import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComingSoonSection from "@/app/components/sections/shared/coming-soon/ComingSoonSection";
import { SERVICES } from "@/lib/services";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.id }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id === slug);
  if (!service) return {};
  return {
    ...pageMetadata({
      title: `${service.name}: Details Coming Soon`,
      description: `The full ${service.name} page is coming soon. See what we do on the services page or get in touch to talk about your project.`,
      path: `/services/${service.id}`,
    }),
  };
}

// Service detail pages show "Coming soon" (requested 2026-10-20) until the real pages exist.
export default async function ServiceDetailPage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id === slug);
  if (!service) notFound();

  return (
    <ComingSoonSection
      id="service"
      eyebrow={service.name}
      status="Details in progress"
      title={
        <>
          The details are
          <br className="max-lg:hidden" /> coming soon.
        </>
      }
      description={`We are writing up how we handle ${service.name}. In the meantime, tell us what you need and we will get back to you directly.`}
      secondary={{ label: "All services", href: "/services" }}
    />
  );
}
