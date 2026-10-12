import type { Metadata } from "next";
import CaseStudiesHeroSection from "@/app/components/sections/case-studies/hero/CaseStudiesHeroSection";
import AllCaseStudiesSection from "@/app/components/sections/case-studies/all-case-studies/AllCaseStudiesSection";
import CaseStudyListSection from "@/app/components/sections/case-studies/case-study-list/CaseStudyListSection";
import CtaSection from "@/app/components/sections/shared/cta/CtaSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Case Studies",
  description:
    "How AWTOMATIG helps businesses improve digital infrastructure, streamline operations, connect systems and strengthen the workflows behind everyday execution.",
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
