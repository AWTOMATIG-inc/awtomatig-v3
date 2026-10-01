import Image from "next/image";
import Logo from "@/public/images/awtomatig-logo.png";
import { Button } from "@/app/components/ui";

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
];

const TAGS = ["Infrastructure", "Operations", "Automation", "Integrations", "AdTech"];

export default function HeroContent() {
  return (
    <div className="hero-inner site-container relative z-20 flex flex-1 flex-col">
      <div>
        <div className="hero-badge">
          <Image src={Logo} alt="AWTOMATIG Logo" width={16} height={16} />
          <span>Build the systemssss.</span>
        </div>

        <h1 className="hero-title">
          The operational
          <br /> layer behind modern
          <br /> businesses.
        </h1>
      </div>

      <div className="mt-auto pt-[calc(var(--u)*40)]">
        <div className="hero-row">
          <p className="hero-copy">
            From websites and back-office operations to ERP systems, automation,
            <br /> and AdTech workflows, AWTOMATIG connects people, process, systems,
            <br /> and technology into one scalable ecosystem.
          </p>

          <div className="hero-aside">
            <div className="hero-avatars">
              {AVATARS.map((src) => (
                <Image key={src} src={src} alt="Team member" width={120} height={120} />
              ))}
            </div>
            <p className="hero-proof">Built by people who understand operations.</p>

            <div className="hero-ctas">
              <Button variant="primary" size="lg" className="hero-btn hero-btn-primary">
                Explore Our Services
              </Button>
              <Button variant="glass" size="lg" className="hero-btn hero-btn-secondary">
                Start a Conversation
              </Button>
            </div>
          </div>
        </div>

        <div className="hero-strip">
          <p className="hero-strip-title">Built for the systems behind the business.</p>
          <ul className="hero-tags">
            {TAGS.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
