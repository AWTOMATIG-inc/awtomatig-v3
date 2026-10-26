import type { Metadata } from "next";
import CaseStudiesHeroSection from "@/app/components/sections/case-studies/hero/CaseStudiesHeroSection";
import AllCaseStudiesSection from "@/app/components/sections/case-studies/all-case-studies/AllCaseStudiesSection";
import CaseStudyListSection from "@/app/components/sections/case-studies/case-study-list/CaseStudyListSection";
import CtaSection from "@/app/components/sections/shared/cta/CtaSection";
import { pageMetadata } from "@/lib/metadata";
import ComingSoon from "@/app/components/sections/shared/coming-soon/ComingSoonSection";

export const metadata: Metadata = pageMetadata({
  title: "Website, ERP & Operations Case Studies",
  description:
    "See how AWTOMATIG rebuilds websites, streamlines back-office operations, connects ERP systems and strengthens the workflows behind everyday execution.",
  path: "/case-studies",
});

export default function CaseStudiesPage() {
  return (
    <>
      
      
      <CaseStudiesHeroSection />
      <AllCaseStudiesSection />
      <CaseStudyListSection />
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
