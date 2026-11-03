import type { Metadata } from "next";
import CampaignHeroSection from "@/app/components/sections/campaign/hero/CampaignHeroSection";
import BuiltForB2bSection from "@/app/components/sections/campaign/built-for-b2b/BuiltForB2bSection";
import CapabilitiesSection from "@/app/components/sections/campaign/capabilities/CapabilitiesSection";
import ProblemsSection from "@/app/components/sections/campaign/problems/ProblemsSection";
import HowWeHelpSection from "@/app/components/sections/campaign/how-we-help/HowWeHelpSection";
import HowWeWorkSection from "@/app/components/sections/campaign/how-we-work/HowWeWorkSection";
import ProvenCaseStudiesSection from "@/app/components/sections/campaign/case-studies/ProvenCaseStudiesSection";
import WhatChangesSection from "@/app/components/sections/campaign/what-changes/WhatChangesSection";
import FaqSection from "@/app/components/sections/shared/faq/FaqSection";
import LetsTalkSection from "@/app/components/sections/campaign/lets-talk/LetsTalkSection";
import ProvenSection from "@/app/components/sections/shared/proven/ProvenSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Website Infrastructure for B2B Businesses",
  description:
    "AWTOMATIG helps growing B2B teams build, operate and improve the digital infrastructure behind websites, content systems and connected business workflows.",
  path: "/website-infrastructure",
});

export default function WebsiteInfrastructureCampaignPage() {
  return (
    <>
      <CampaignHeroSection />
      <ProvenSection
        id="proof"
        eyebrow="Trust / Proof"
        title={
          <>
            Trusted to support the
            <br className="max-lg:hidden" /> systems behind
            <br className="max-lg:hidden" /> growing businesses.
          </>
        }
        decor
        topPadding="lg:pt-116"
      />
      <CapabilitiesSection />
      <ProblemsSection />
      <HowWeHelpSection />
      <WhatChangesSection />
      <HowWeWorkSection />
      <ProvenCaseStudiesSection />
      <BuiltForB2bSection />
      <FaqSection />
      <LetsTalkSection />
    </>
  );
}
