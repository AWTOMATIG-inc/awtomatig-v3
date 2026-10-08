import Image from "next/image";
import { Eyebrow } from "@/app/components/ui";
import { GROWTH_STEPS, type GrowthStep } from "./growth";

function Photo({ step }: { step: GrowthStep }) {
  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-16 max-lg:order-first md:aspect-auto lg:h-296">
      <Image
        src={step.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 318px, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function StepCard({ step, number }: { step: GrowthStep; number: number }) {
  return (
    <div className="flex flex-col rounded-16 bg-surface-subtle p-24 lg:h-296 lg:pb-20">
      <span className="type-body-16 grid size-48 place-items-center rounded-8 bg-surface text-black/40">
        {String(number).padStart(2, "0")}.
      </span>
      <h3 className="type-heading-28 mt-32 tracking-tight lg:mt-auto lg:pt-32">{step.title}</h3>
      <p className="type-body-16 mt-8 max-w-266 text-fg-primary">{step.description}</p>
    </div>
  );
}

// About page: four steps as a checkerboard of photos and numbered text cards (two rows of four on desktop)
export default function GrowthSection() {
  return (
    <section id="growth" aria-labelledby="growth-title" className="bg-surface text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-116 lg:pb-119">
        <div className="grid gap-20 lg:grid-cols-[317fr_1014fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">Growing with the work</Eyebrow>
          <h2 id="growth-title" className="type-heading-60">
            From focused projects to
            <br className="max-lg:hidden" /> connected systems.
          </h2>
        </div>

        {/* Desktop: each li is two grid cells, in DOM order (photo first in row 1, card first in row 2) */}
        <ol className="mt-40 grid gap-40 lg:mt-65 lg:grid-cols-4 lg:gap-20">
          {GROWTH_STEPS.map((step, i) => (
            <li key={step.title} className="grid gap-20 md:grid-cols-2 lg:contents">
              {step.imageFirst ? (
                <>
                  <Photo step={step} />
                  <StepCard step={step} number={i + 1} />
                </>
              ) : (
                <>
                  <StepCard step={step} number={i + 1} />
                  <Photo step={step} />
                </>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
