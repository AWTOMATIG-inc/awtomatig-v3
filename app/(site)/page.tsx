import type { Metadata } from "next";
import CaseStudiesSection from "@/app/components/sections/home/case-studies/CaseStudiesSection";
import HeroSection from "@/app/components/sections/home/hero/HeroSection";
import OperationsSection from "@/app/components/sections/home/operations/OperationsSection";
// Human operations is hidden until its content is ready; uncomment this import and the section below to restore it.
// import HumanOperationsSection from "@/app/components/sections/home/human-operations/HumanOperationsSection";
import StackingCards from "@/app/components/sections/home/services/StackingCards";
import ServicesSection from "@/app/components/sections/home/services/ServicesSection";
import TrustedOperationsSection from "@/app/components/sections/home/trusted-operations/TrustedOperationsSection";
import WhyAwtomatigSection from "@/app/components/sections/home/why-awtomatig/WhyAwtomatigSection";
import HowWeWorkSection from "@/app/components/sections/home/how-we-work/HowWeWorkSection";
import TestimonialsSection from "@/app/components/sections/shared/testimonials/TestimonialsSection";
import CtaSection from "@/app/components/sections/shared/cta/CtaSection";
import { pageMetadata } from "@/lib/metadata";
import { SITE } from "@/lib/site";

// No `title`: Home uses the root layout's default title
export const metadata: Metadata = pageMetadata({ description: SITE.description, path: "/" });

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      {/* Operations pins while How we work slides over it; Case studies then slides over the last step */}
      <StackingCards hold={false}>
        <div data-stack-card className="stack-card">
          <OperationsSection />
        </div>
        <HowWeWorkSection />
      </StackingCards>
      <div className="relative">{/**  <CaseStudiesSection /> */}</div>
      <TrustedOperationsSection />
      <WhyAwtomatigSection />
      <TestimonialsSection />
      {/* Human operations: temporarily hidden, its content (team photo, stats) isn't ready yet.
          To enable it again, uncomment the line below and the HumanOperationsSection import at the top. */}
      {/* <HumanOperationsSection /> */}
      <CtaSection />
    </>
  );
}
