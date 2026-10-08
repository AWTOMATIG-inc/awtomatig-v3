import type { Metadata } from "next";
import Footer from "../components/layout/footer/Footer";
import Header from "../components/layout/header/Header";
import ProcessHeroSection from "../components/sections/process/hero/ProcessHeroSection";
import ProcessCtaSection from "../components/sections/process/cta/ProcessCtaSection";
import ProcessStepsSection from "../components/sections/process/steps/ProcessStepsSection";

export const metadata: Metadata = {
  title: "Process | AWTOMATIG",
  description:
    "From understanding the problem to implementation and ongoing support, AWTOMATIG follows a structured process that keeps people, workflows, systems and technology aligned.",
};

export default function ProcessPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <ProcessHeroSection />
        <ProcessStepsSection />
        <ProcessCtaSection />
      </main>
      <Footer />
    </>
  );
}
