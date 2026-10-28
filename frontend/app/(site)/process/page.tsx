import type { Metadata } from "next";
import ProcessHeroSection from "@/app/components/sections/process/hero/ProcessHeroSection";
import ProcessCtaSection from "@/app/components/sections/process/cta/ProcessCtaSection";
import ProcessStepsSection from "@/app/components/sections/process/steps/ProcessStepsSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Our Project Process: Audit, Build and Support",
  description:
    "From discovery and audit to implementation and ongoing support, AWTOMATIG follows a structured process for website, ERP and automation projects.",
  path: "/process",
});

export default function ProcessPage() {
  return (
    <>
      <ProcessHeroSection />
      <ProcessStepsSection />
      <ProcessCtaSection />
    </>
  );
}
