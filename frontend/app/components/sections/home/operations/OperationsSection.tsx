import Image from "next/image";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { Eyebrow } from "@/app/components/ui";
import ProblemsBlock from "../../shared/problems/ProblemsBlock";
import { PILLARS } from "./operations";

export default function OperationsSection() {
  return (
    <section
      id="operations"
      aria-labelledby="operations-title"
      className="bg-surface-subtle text-fg-strong relative overflow-hidden"
    >
      {/* Brand mark, cropped by the top-right corner */}
      <Image
        src={Decor}
        alt=""
        className="pointer-events-none absolute -top-91 -right-50 h-auto w-160 opacity-20 select-none lg:-top-179 lg:-right-98 lg:w-315"
      />

      <div className="site-container relative">
        {/* Connected operations */}
        <div className="grid gap-20 pt-60 lg:grid-cols-[365fr_955fr] lg:gap-0 lg:pt-116">
          <Eyebrow className="self-start lg:mt-10">Connected operations</Eyebrow>
          <h2 id="operations-title" className="type-heading-60 max-w-[10em]">
            Your business doesn’t operate in silos. Neither should your systems.
          </h2>
        </div>

        <ul className="mt-50 grid gap-40 sm:grid-cols-2 lg:mt-90 lg:grid-cols-4 lg:gap-70">
          {PILLARS.map((pillar, i) => (
            <li
              key={pillar.title}
              className="lg:not-first:before:bg-border relative lg:not-first:before:absolute lg:not-first:before:inset-y-0 lg:not-first:before:-left-35 lg:not-first:before:w-px"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-8 bg-surface grid size-48 place-items-center">
                  <pillar.icon className="size-28" />
                </span>
                <span className="type-body-16 text-black/60">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="type-heading-28 mt-24 lg:mt-48">{pillar.title}</h3>
              <p className="type-body-16 mt-8">{pillar.description}</p>
            </li>
          ))}
        </ul>

        <div className="border-border mt-60 border-t lg:mt-117" />

        <ProblemsBlock />
      </div>
    </section>
  );
}
