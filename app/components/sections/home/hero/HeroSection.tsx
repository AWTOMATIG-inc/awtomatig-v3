import InteractiveHero from "./InteractiveHero";
import HeroContent from "./HeroContent";

// Home hero: full-bleed animated background (InteractiveHero) with content in the site container
export default function HeroSection() {
  return (
    <InteractiveHero>
      <HeroContent />
    </InteractiveHero>
  );
}
