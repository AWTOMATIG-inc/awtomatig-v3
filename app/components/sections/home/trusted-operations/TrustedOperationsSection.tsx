import Image from "next/image";
import { Eyebrow, LinesBackground } from "@/app/components/ui";
import { PARTNER_LOGOS } from "../../shared/partners/partners";
import ClientSystemsCard from "./ClientSystemsCard";
import ResultsCard from "./ResultsCard";
import { TRUSTED_LINES } from "./trustedLines";

// Home: "Trusted operations", headline results on a dark teal backdrop, then the client logos
export default function TrustedOperationsSection() {
  return (
    <LinesBackground
      preset={TRUSTED_LINES}
      id="trusted-operations"
      aria-labelledby="trusted-operations-title"
      className="text-fg-inverse"
    >
      <div className="site-container relative z-20 py-60 lg:pt-100 lg:pb-89">
        <div className="grid gap-20 lg:grid-cols-[376fr_631fr_324fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-6">Trusted operations</Eyebrow>
          <h2 id="trusted-operations-title" className="type-heading-60 text-gradient-display">
            Operational support
            <br className="max-lg:hidden" /> backed by real results.
          </h2>
          <p className="type-body-16 max-w-330 text-white/80 lg:mt-23">
            From infrastructure and business systems to operational execution, AWTOMATIG helps teams build more reliable processes
            and clearer ways of working.
          </p>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-58 lg:grid-cols-[869fr_424fr]">
          <ClientSystemsCard />
          <ResultsCard />
        </div>

        <div className="mt-50 flex items-center gap-20 lg:mt-51 lg:gap-52">
          <span aria-hidden="true" className="h-px flex-1 bg-white/12" />
          <h3 className="type-heading-24 text-center tracking-tight">Trusted By Leading Companies</h3>
          <span aria-hidden="true" className="h-px flex-1 bg-white/12" />
        </div>

        <ul className="mt-32 flex flex-wrap items-center justify-center gap-x-32 gap-y-20 lg:mt-30 lg:min-h-80 lg:flex-nowrap lg:justify-between lg:px-16">
          {PARTNER_LOGOS.map((partner) => (
            <li key={partner.name}>
              <Image
                src={partner.logo}
                alt={partner.name}
                className={`h-40 w-auto object-contain opacity-70 brightness-0 invert ${partner.height}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </LinesBackground>
  );
}
