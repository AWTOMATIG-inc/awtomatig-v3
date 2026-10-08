import type { Metadata } from "next";
import Footer from "../components/layout/footer/Footer";
import Header from "../components/layout/header/Header";
import AboutHeroSection from "../components/sections/about/hero/AboutHeroSection";
import OurStorySection from "../components/sections/about/our-story/OurStorySection";
import MissionVisionSection from "../components/sections/about/mission-vision/MissionVisionSection";
import HowWeThinkSection from "../components/sections/about/how-we-think/HowWeThinkSection";
import TeamSection from "../components/sections/about/team/TeamSection";
import GrowthSection from "../components/sections/about/growth/GrowthSection";
import CultureSection from "../components/sections/about/culture/CultureSection";
import AboutCtaSection from "../components/sections/about/cta/AboutCtaSection";

export const metadata: Metadata = {
  title: "About | AWTOMATIG",
  description:
    "Meet the people who build the systems behind the scenes: AWTOMATIG turns complex operations into clear, connected and efficient systems.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <AboutHeroSection />
        <OurStorySection />
        <MissionVisionSection />
        <HowWeThinkSection />
        <TeamSection />
        <GrowthSection />
        <CultureSection />
        <AboutCtaSection />
      </main>
      <Footer />
    </>
  );
}
