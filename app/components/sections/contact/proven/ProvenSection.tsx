import Image from "next/image";
import { Eyebrow } from "@/app/components/ui";
import { PARTNERS, PROVEN_STATS } from "./proven";

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

        <ul className="mt-40 grid gap-12 sm:grid-cols-2 lg:mt-70 lg:grid-cols-4 lg:gap-20">
          {PROVEN_STATS.map((stat) => (
            <li key={stat.label} className="flex flex-col rounded-16 bg-surface p-24 lg:min-h-235 lg:pt-28 lg:pb-25">
              <h3 className="type-label-14 uppercase">{stat.label}</h3>
              <div className="mt-40 lg:mt-auto">
                <p className="type-heading-50 font-normal">{stat.value}</p>
                <p className="type-body-14 mt-12 max-w-240 text-fg-primary">{stat.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-50 flex items-center gap-20 lg:mt-58 lg:gap-53">
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          <h3 className="type-heading-24 text-center tracking-tight">Trusted By Leading Companies</h3>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>

        <ul className="mt-32 flex flex-wrap items-center justify-center gap-x-32 gap-y-20 lg:mt-26 lg:min-h-80 lg:flex-nowrap lg:justify-between lg:gap-0 lg:px-12">
          {PARTNERS.map((partner) => (
            <li key={partner.name}>
              <Image
                src={partner.logo}
                alt={partner.name}
                className={`h-40 w-auto cursor-pointer object-contain transition-[filter,opacity] duration-200 motion-reduce:transition-none ${partner.height} ${partner.tone}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
