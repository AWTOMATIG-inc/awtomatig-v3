import Image from "next/image";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { Eyebrow } from "@/app/components/ui";
import { PILLARS, PROBLEMS } from "./operations";
import ProblemCard from "./ProblemCard";

export default function OperationsSection() {
  return (
    <section id="operations" aria-labelledby="operations-title" className="relative overflow-hidden bg-surface-subtle text-fg-strong">
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
              className="relative lg:not-first:before:absolute lg:not-first:before:inset-y-0 lg:not-first:before:-left-35 lg:not-first:before:w-px lg:not-first:before:bg-border"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-48 place-items-center rounded-8 bg-surface">
                  <pillar.icon className="size-28" />
                </span>
                <span className="type-body-16 text-black/40">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="type-heading-28 mt-24 lg:mt-48">{pillar.title}</h3>
              <p className="type-body-16 mt-8">{pillar.description}</p>
            </li>
          ))}
        </ul>

        <div className="mt-60 border-t border-border lg:mt-117" />

        {/* When things break down */}
        <div className="grid gap-20 pt-60 lg:grid-cols-[365fr_565fr_390fr] lg:gap-0 lg:pt-116">
          <Eyebrow className="self-start lg:mt-10">When things break down</Eyebrow>
          <h2 className="type-heading-60 max-w-[8em]">Complexity grows quietly.</h2>
          <p className="type-body-16 max-w-390 self-end">
            Disconnected tools, manual processes and unclear ownership accumulate as businesses grow.
          </p>
        </div>

        <ul className="mt-40 grid gap-20 pb-60 lg:mt-77 md:grid-cols-2 xl:grid-cols-4 lg:pb-104">
          {PROBLEMS.map((problem) => (
            <li key={problem.title} className="flex">
              <ProblemCard problem={problem} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
