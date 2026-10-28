import type { Metadata } from "next";
import ServicesHeroSection from "@/app/components/sections/services/hero/ServicesHeroSection";
import WhatWeDoSection from "@/app/components/sections/services/what-we-do/WhatWeDoSection";
import EcosystemSection from "@/app/components/sections/services/ecosystem/EcosystemSection";
import HowWeSupportSection from "@/app/components/sections/services/how-we-support/HowWeSupportSection";
import ServicesSection from "@/app/components/sections/home/services/ServicesSection";
import CtaSection from "@/app/components/sections/shared/cta/CtaSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Business Automation, ERP & Web Services",
  description:
    "Website development, back-office operations, ERP implementation and AdTech services. AWTOMATIG builds and runs the systems behind your business.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <ServicesHeroSection />
      <WhatWeDoSection />
      <ServicesSection cta={{ label: "View details", href: (id) => `/services/${id}` }} />
      <EcosystemSection />
      <HowWeSupportSection />
      <CtaSection
        layout="services"
        title={
          <>
            What does your business
            <br className="max-lg:hidden" /> need to run better?
          </>
        }
        description={
          <>
            Whether the challenge sits in your website, internal operations, business
            <br className="max-lg:hidden" /> systems or advertising workflow, tell us where things are getting stuck.
          </>
        }
        note={{
          title: "Not sure which service fits?",
          description:
            "Start with the problem. We’ll help identify whether the answer sits in infrastructure, operations, business systems, AdTech or across several of them.",
        }}
      />
    </>
  );
}
