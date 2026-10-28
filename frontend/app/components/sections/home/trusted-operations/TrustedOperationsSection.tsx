import { Eyebrow, LinesBackground } from "@/app/components/ui";
import MarqueeTrack from "../../shared/partners/MarqueeTrack";
import { TRUSTED_PARTNERS } from "./trustedOperations";
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

        <MarqueeTrack
          partners={TRUSTED_PARTNERS}
          ruleClassName="bg-white/12"
          rowClassName="mt-50 lg:mt-51 lg:gap-52"
          trackClassName="mt-32 lg:mt-30"
        />
      </div>
    </LinesBackground>
  );
}
