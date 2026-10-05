import Footer from "./components/layout/footer/Footer";
import Header from "./components/layout/header/Header";
import CaseStudiesSection from "./components/sections/home/case-studies/CaseStudiesSection";
import HeroSection from "./components/sections/home/hero/HeroSection";
import OperationsSection from "./components/sections/home/operations/OperationsSection";
import ServicesSection from "./components/sections/home/services/ServicesSection";
import WhyAwtomatigSection from "./components/sections/home/why-awtomatig/WhyAwtomatigSection";
import CtaSection from "./components/sections/shared/cta/CtaSection";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <ServicesSection />
        <OperationsSection />
        <CaseStudiesSection />
        <WhyAwtomatigSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
