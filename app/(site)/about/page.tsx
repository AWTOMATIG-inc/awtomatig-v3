import type { Metadata } from "next";
import AboutHeroSection from "@/app/components/sections/about/hero/AboutHeroSection";
import OurStorySection from "@/app/components/sections/about/our-story/OurStorySection";
import MissionVisionSection from "@/app/components/sections/about/mission-vision/MissionVisionSection";
import HowWeThinkSection from "@/app/components/sections/about/how-we-think/HowWeThinkSection";
import TeamSection from "@/app/components/sections/about/team/TeamSection";
import GrowthSection from "@/app/components/sections/about/growth/GrowthSection";
import CultureSection from "@/app/components/sections/about/culture/CultureSection";
import TestimonialsSection from "@/app/components/sections/shared/testimonials/TestimonialsSection";
import AboutCtaSection from "@/app/components/sections/about/cta/AboutCtaSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Meet the people who build the systems behind the scenes: AWTOMATIG turns complex operations into clear, connected and efficient systems.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <AboutHeroSection />
      <OurStorySection />
      <MissionVisionSection />
      <HowWeThinkSection />
      <TeamSection />
      <GrowthSection />
      <CultureSection />
      <TestimonialsSection />
      <AboutCtaSection />
    </>
  );
}
