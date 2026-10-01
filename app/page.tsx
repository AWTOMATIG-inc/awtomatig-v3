import Header from "./components/layout/header/Header";
import HeroSection from "./components/sections/home/hero/HeroSection";
import ServicesSection from "./components/sections/home/services/ServicesSection";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <ServicesSection />
      </main>
    </>
  );
}
