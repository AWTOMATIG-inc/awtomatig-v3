import type { Metadata } from "next";
import Footer from "../components/layout/footer/Footer";
import Header from "../components/layout/header/Header";
import ServicesHeroSection from "../components/sections/services/hero/ServicesHeroSection";
import WhatWeDoSection from "../components/sections/services/what-we-do/WhatWeDoSection";
import EcosystemSection from "../components/sections/services/ecosystem/EcosystemSection";
import HowWeSupportSection from "../components/sections/services/how-we-support/HowWeSupportSection";
import ServicesSection from "../components/sections/home/services/ServicesSection";
import CtaSection from "../components/sections/shared/cta/CtaSection";

export const metadata: Metadata = {
  title: "Services | AWTOMATIG",
  description:
    "Website infrastructure, back-office operations, ERP and business systems, and AdTech: the systems, operations and technology behind your business.",
};

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <ServicesHeroSection />
        <WhatWeDoSection />
        <ServicesSection />
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
      </main>
      <Footer />
    </>
  );
}
