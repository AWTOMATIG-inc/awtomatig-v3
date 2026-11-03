import type { Metadata } from "next";
import CampaignHeroSection from "@/app/components/sections/campaign/hero/CampaignHeroSection";
import BuiltForB2bSection from "@/app/components/sections/campaign/built-for-b2b/BuiltForB2bSection";
import CapabilitiesSection from "@/app/components/sections/campaign/capabilities/CapabilitiesSection";
import ProblemsSection from "@/app/components/sections/campaign/problems/ProblemsSection";
import HowWeHelpSection from "@/app/components/sections/campaign/how-we-help/HowWeHelpSection";
import HowWeWorkSection from "@/app/components/sections/campaign/how-we-work/HowWeWorkSection";
import ProvenCaseStudiesSection from "@/app/components/sections/campaign/case-studies/ProvenCaseStudiesSection";
import WhatChangesSection from "@/app/components/sections/campaign/what-changes/WhatChangesSection";
import { CLEANING_FAQS, CLEANING_STATS } from "@/app/components/sections/campaign/cleaning";
import FaqSection from "@/app/components/sections/shared/faq/FaqSection";
import LetsTalkSection from "@/app/components/sections/campaign/lets-talk/LetsTalkSection";
import ProvenSection from "@/app/components/sections/shared/proven/ProvenSection";
import { pageMetadata } from "@/lib/metadata";

// The background video of "Relevant experience", public in the Cloudflare R2 bucket (the host is allowed in the CSP, next.config.ts)
const PROOF_VIDEO = "https://pub-15cceab11b2f454f828f50cb4ba7a3c5.r2.dev/output-compressed.mp4";

export const metadata: Metadata = pageMetadata({
  title: "Cleaning Company Websites & Business Systems",
  description:
    "Website development, CRM integrations, internal tools, and back-office support for established cleaning companies. Discuss your next improvement with AWTOMATIG.",
  path: "/cleaning-company-solutions",
});

export default function CleaningCompanySolutionsPage() {
  return (
    <>
      <CampaignHeroSection />
      <ProvenSection
        id="proof"
        eyebrow="Relevant experience"
        title={
          <>
            Supporting the systems
            <br className="max-lg:hidden" /> behind established
            <br className="max-lg:hidden" /> businesses.
          </>
        }
        stats={CLEANING_STATS}
        logoCaption="Selected businesses we have supported"
        videoSrc={PROOF_VIDEO}
        decor
        topPadding="lg:pt-90"
        bottomPadding="lg:pb-90"
      />
      <CapabilitiesSection />
      <ProblemsSection />
      <HowWeHelpSection />
      <WhatChangesSection />
      <HowWeWorkSection />
      <ProvenCaseStudiesSection />
      <BuiltForB2bSection />
      <FaqSection
        paddingClassName="py-60 lg:pt-90 lg:pb-90"
        items={CLEANING_FAQS}
        eyebrow="Common questions"
        card={{
          text: (
            <>
              Have a specific
              <br /> requirement?
              <br /> Let’s discuss it.
            </>
          ),
          label: "Discuss your needs",
          href: "#get-started",
        }}
      />
      <LetsTalkSection />
    </>
  );
}
