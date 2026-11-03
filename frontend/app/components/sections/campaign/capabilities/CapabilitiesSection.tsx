import Image from "next/image";
import { Eyebrow, LinesBackground } from "@/app/components/ui";
import showcase from "@/public/images/landing_page/web.png";
import { CAPABILITIES } from "./capabilities";
import { CAPABILITIES_LINES } from "./capabilitiesLines";

// Campaign page: "Capabilities", the eight capability areas beside a showcase image. The first area is highlighted
// (the design has no other state), so the list is plain text, not controls. `id="service"` is the hero's "Explore the Service" target.
export default function CapabilitiesSection() {
  return (
    <LinesBackground preset={CAPABILITIES_LINES} id="service" aria-labelledby="capabilities-title" className="text-fg-inverse">
      <div className="site-container relative z-20 py-60 lg:pt-120 lg:pb-113">
        <div className="grid gap-20 lg:grid-cols-[317fr_668fr_335fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">Capabilities</Eyebrow>
          <h2 id="capabilities-title" className="type-heading-60">
            Everything required
            <br className="max-lg:hidden" /> to build and operate
            <br className="max-lg:hidden" /> the digital layer.
          </h2>
          <p className="type-body-16 text-white/80 lg:self-end">
            The service is structured around eight core
            <br className="max-lg:hidden" /> capability areas, each designed to work
            <br className="max-lg:hidden" /> independently or as part of a wider Website
            <br className="max-lg:hidden" /> Infrastructure engagement.
          </p>
        </div>

        <div className="mt-40 grid gap-40 lg:mt-76 lg:grid-cols-[542fr_778fr] lg:gap-0">
          <ol>
            {CAPABILITIES.map(({ title, description }, i) => {
              const number = String(i + 1).padStart(2, "0");
              return description ? (
                <li key={title}>
                  <div className="border-action-primary border-l-2 pl-32">
                    <h3 className="type-heading-24 text-fg-inverse tracking-tight">
                      <span className="mr-10">{number}.</span>
                      {title}
                    </h3>
                    <p className="type-body-15 mt-6 max-w-420 text-white/80">{description}</p>
                  </div>
                  <span aria-hidden="true" className="mt-24 mr-40 mb-6 ml-32 block h-px bg-white/12" />
                </li>
              ) : (
                <li key={title} className="border-l-2 border-transparent py-10 pl-32">
                  <h3 className="type-heading-24 tracking-tight text-white/40">
                    <span className="mr-10">{number}.</span>
                    {title}
                  </h3>
                </li>
              );
            })}
          </ol>

          <Image
            src={showcase}
            alt="A corporate website shown across several pages: a consulting homepage, a footer and statistics blocks"
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="rounded-20 h-auto w-full"
          />
        </div>
      </div>
    </LinesBackground>
  );
}
