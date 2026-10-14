import type { Metadata } from "next";
import ProcessHeroSection from "@/app/components/sections/process/hero/ProcessHeroSection";
import ProcessCtaSection from "@/app/components/sections/process/cta/ProcessCtaSection";
import ProcessStepsSection from "@/app/components/sections/process/steps/ProcessStepsSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Process",
  description:
    "From understanding the problem to implementation and ongoing support, AWTOMATIG follows a structured process that keeps people, workflows, systems and technology aligned.",
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
