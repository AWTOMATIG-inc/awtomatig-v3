import type { Metadata } from "next";
import CaseStudiesSection from "@/app/components/sections/home/case-studies/CaseStudiesSection";
import HeroSection from "@/app/components/sections/home/hero/HeroSection";
import OperationsSection from "@/app/components/sections/home/operations/OperationsSection";
import HumanOperationsSection from "@/app/components/sections/home/human-operations/HumanOperationsSection";
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
      <OperationsSection />
      <HowWeWorkSection />
      <CaseStudiesSection />
      <TrustedOperationsSection />
      <WhyAwtomatigSection />
      <TestimonialsSection />
      <HumanOperationsSection />
      <CtaSection />
    </>
  );
}
