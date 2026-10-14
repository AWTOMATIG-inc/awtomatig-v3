import { Eyebrow } from "@/app/components/ui";
import MarqueeTrack from "./MarqueeTrack";
import { PARTNERS, PROVEN_STATS } from "./proven";

// Only stats with a real figure are shown
const STATS = PROVEN_STATS.filter((stat) => stat.value);

// Contact page: "Why AWTOMATIG" proof block: four stat cards and a row of client logos
export default function ProvenSection() {
  return (
    <section id="proven" aria-labelledby="proven-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container py-60 lg:pt-101 lg:pb-116">
        <div className="grid gap-20 lg:grid-cols-[360fr_971fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-5">Why AWTOMATIG</Eyebrow>
          <h2 id="proven-title" className="type-heading-60">
            Proven across the
            <br className="max-lg:hidden" /> systems that keep
            <br className="max-lg:hidden" /> businesses moving.
          </h2>
        </div>

        {STATS.length > 0 && (
          <ul className="mt-40 grid gap-12 sm:grid-cols-2 lg:mt-70 lg:grid-cols-4 lg:gap-20">
            {STATS.map((stat) => (
              <li key={stat.label} className="rounded-16 bg-surface flex flex-col p-24 lg:min-h-235 lg:pt-28 lg:pb-25">
                <h3 className="type-label-14 uppercase">{stat.label}</h3>
                <div className="mt-40 lg:mt-auto">
                  <p className="type-heading-50 font-normal">{stat.value}</p>
                  <p className="type-body-14 text-fg-primary mt-12 max-w-240">{stat.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <MarqueeTrack partners={PARTNERS} />
      </div>
    </section>
  );
}
