import { CountUp } from "@/app/components/ui";
import WorldMap from "./WorldMap";
import { ECOSYSTEM_ICONS } from "./trustedOperations";

// Dark card: the headline figure on the left, four ecosystem tiles top right, a dotted world map along the bottom
export default function ClientSystemsCard() {
  return (
    <div className="bg-trusted-card rounded-16 text-fg-inverse relative isolate overflow-hidden p-24 lg:min-h-415 lg:p-36">
      <span aria-hidden="true" className="diag-ribs absolute inset-0 -z-10 text-white/6" />
      <WorldMap className="absolute -bottom-69 left-1/2 -z-10 -ml-20 max-w-none -translate-x-1/2 text-white/20" />

      <p className="type-display-80 font-normal">
        <CountUp value="35+" />
      </p>
      <p className="type-heading-20 mt-12">Client systems supported</p>
      <p className="type-body-14 mt-12 max-w-240 text-white/60">Across regions and operational environments</p>

      <div className="mt-32 max-w-346 xl:absolute xl:top-35 xl:right-34 xl:mt-0 xl:w-346">
        <ul aria-hidden="true" className="grid grid-cols-4 gap-6">
          {ECOSYSTEM_ICONS.map((Icon, index) => (
            <li
              key={index}
              className="rounded-6 flex h-48 items-center justify-center border border-white/20 bg-linear-to-br from-black/60 to-black/15 lg:h-54"
            >
              <Icon className="size-26 text-white" />
            </li>
          ))}
        </ul>
        <p className="type-body-14 mt-16 uppercase">Connected across client ecosystems</p>
      </div>

      <div aria-hidden="true" className="h-170 lg:hidden" />
    </div>
  );
}
