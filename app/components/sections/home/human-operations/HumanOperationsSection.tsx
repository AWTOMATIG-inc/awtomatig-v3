import Image from "next/image";
import { Eyebrow } from "@/app/components/ui";
import { STATS, TEAM_IMAGE, TEAM_IMAGE_ALT } from "./humanOperations";

export default function HumanOperationsSection() {
  return (
    <section id="human-operations" aria-labelledby="human-operations-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-50 lg:pb-120">
        <div className="grid gap-20 lg:grid-cols-[365fr_631fr_317fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">Human operations</Eyebrow>
          <h2 id="human-operations-title" className="type-heading-60 max-w-[10em]">
            Technology connects the workflow. People keep it moving.
          </h2>
          <p className="type-body-16 self-end text-fg-primary">
            AWTOMATIG combines technical systems with structured operational support, helping businesses manage the work
            that technology alone cannot solve.
          </p>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-72 lg:grid-cols-[935fr_317fr] lg:gap-60">
          <Image
            src={TEAM_IMAGE}
            alt={TEAM_IMAGE_ALT}
            sizes="(min-width: 1024px) 935px, 100vw"
            className="aspect-4/3 w-full rounded-16 object-cover lg:aspect-auto lg:h-441"
          />

          <div>
            <p className="type-label-14 grid h-40 place-items-center rounded-6 bg-surface uppercase">Operational team view</p>
            <ul className="mt-20 lg:mt-25">
              {STATS.map((stat) => (
                <li key={stat.label} className="relative border-b border-border pt-20 pb-20 last:border-b-0 lg:h-136">
                  <span aria-hidden className="absolute top-26 right-0 size-8 rounded-full bg-action-primary" />
                  <p className="type-heading-40">{stat.value}</p>
                  <p className="type-body-14 mt-10 uppercase text-fg-primary">{stat.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
