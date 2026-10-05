import { LinesBackground } from "@/app/components/ui";
import HeroContent from "./HeroContent";
import { HERO_LINES } from "./heroLines";

// Home hero: full-bleed animated lines background with content in the site container
export default function HeroSection() {
  return (
    <LinesBackground preset={HERO_LINES} id="hero" className="hero flex min-h-svh flex-col">
      <HeroContent />
    </LinesBackground>
  );
}
