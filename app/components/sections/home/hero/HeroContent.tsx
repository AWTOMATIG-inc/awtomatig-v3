import { BarChartIcon, CloudIcon, DatabaseIcon, ImageFrameIcon } from "@/app/components/icons";
import { Button, Eyebrow } from "@/app/components/ui";

const ECOSYSTEM_ICONS = [ImageFrameIcon, CloudIcon, BarChartIcon, DatabaseIcon];

const TAGS = ["Infrastructure", "Operations", "Automation", "Integrations", "AdTech"];

export default function HeroContent() {
  return (
    <div className="hero-inner site-container relative z-20 flex flex-1 flex-col pb-40 lg:pb-80 lg:pt-140">
      <div>
        <Eyebrow className="text-fg-inverse">Build the systemssss.</Eyebrow>

        <h1 className="type-display-100 text-gradient-display mt-24 w-fit">
          The operational
          <br className="max-lg:hidden" /> layer behind modern
          <br className="max-lg:hidden" /> businesses.
        </h1>
      </div>

      <div className="mt-auto pt-40">
        <div className="flex flex-col items-start gap-40 lg:flex-row lg:items-end lg:justify-between">
          <p className="type-body-16 max-w-640 text-fg-inverse lg:type-body-20 lg:max-w-720">
            From websites and back-office operations to ERP systems, automation,
            <br className="max-lg:hidden" /> and AdTech workflows, AWTOMATIG connects people, process, systems,
            <br className="max-lg:hidden" /> and technology into one scalable ecosystem.
          </p>

          <div className="w-full lg:w-auto">
            <div className="flex gap-5">
              {ECOSYSTEM_ICONS.map((Icon, i) => (
                <span key={i} aria-hidden className="glass grid h-48 flex-1 place-items-center rounded-6 text-white lg:h-54 lg:w-83 lg:flex-none">
                  <Icon className="size-24" />
                </span>
              ))}
            </div>
            <p className="type-body-14 mt-16 text-fg-inverse uppercase">Connected across client ecosystems</p>

            <div className="mt-24 flex flex-col gap-12 sm:flex-row lg:mt-34">
              <Button variant="primary" size="lg" className="w-full sm:flex-1 lg:w-250 lg:flex-none">
                Explore Our Services
              </Button>
              <Button variant="glass" size="lg" className="w-full sm:flex-1 lg:w-252 lg:flex-none">
                Start a Conversation
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-40 flex flex-col items-start gap-12 border-y border-white/12 py-20 lg:mt-60 lg:h-102 lg:flex-row lg:items-center lg:justify-between lg:gap-24 lg:py-0">
          <p className="type-heading-18 text-fg-inverse lg:type-heading-20">Built for the systems behind the business.</p>
          <ul className="type-body-16 flex flex-wrap gap-x-20 gap-y-8 text-white/60 lg:flex-nowrap lg:gap-26">
            {TAGS.map((tag) => (
              <li key={tag} className="transition-colors duration-200 hover:text-fg-inverse cursor-pointer motion-reduce:transition-none">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
