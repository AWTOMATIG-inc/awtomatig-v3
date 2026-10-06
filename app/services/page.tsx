import type { Metadata } from "next";
import Footer from "../components/layout/footer/Footer";
import Header from "../components/layout/header/Header";
import ServicesHeroSection from "../components/sections/services/hero/ServicesHeroSection";
import WhatWeDoSection from "../components/sections/services/what-we-do/WhatWeDoSection";
import ServicesSection from "../components/sections/home/services/ServicesSection";

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
      </main>
      <Footer />
    </>
  );
}
