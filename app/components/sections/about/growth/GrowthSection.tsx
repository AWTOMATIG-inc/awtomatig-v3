import Image from "next/image";
import { Eyebrow } from "@/app/components/ui";
import { GROWTH_STEPS, type GrowthStep } from "./growth";

function Photo({ step, className = "" }: { step: GrowthStep; className?: string }) {
  return (
    <div
      className={`rounded-16 relative overflow-hidden md:aspect-4/3 md:max-lg:order-first lg:aspect-auto lg:h-296 ${className}`}
    >
      <Image
        src={step.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 318px, (min-width: 768px) 50vw, 40vw"
        className="object-cover"
      />
    </div>
  );
}

function StepCard({ step, number, className = "" }: { step: GrowthStep; number: number; className?: string }) {
  return (
    <div className={`rounded-16 bg-surface-subtle flex flex-col p-20 max-md:min-h-211 md:p-24 lg:h-296 lg:pb-20 ${className}`}>
      <span className="type-body-14 md:type-body-16 rounded-8 bg-surface grid size-40 place-items-center text-black/40 md:size-48">
        {String(number).padStart(2, "0")}.
      </span>
      <h3 className="type-heading-20 md:type-heading-28 mt-auto pt-24 tracking-tight md:pt-32">{step.title}</h3>
      <p className="type-body-14 md:type-body-16 text-fg-primary mt-8 max-w-266">{step.description}</p>
    </div>
  );
}

// About page: four steps as a checkerboard of photos and numbered text cards (two rows of four on desktop).
// On phones every step is one row (photo narrow, card wide), alternating sides: 1 and 3 photo-left, 2 and 4 photo-right.
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
        <ol className="mt-50 grid gap-20 md:gap-40 lg:mt-65 lg:grid-cols-4 lg:gap-20">
          {GROWTH_STEPS.map((step, i) => {
            const photoLeftOnPhone = i % 2 === 0;
            const photo = <Photo step={step} className={photoLeftOnPhone ? "max-md:order-1" : "max-md:order-2"} />;
            const card = (
              <StepCard step={step} number={i + 1} className={photoLeftOnPhone ? "max-md:order-2" : "max-md:order-1"} />
            );
            return (
              <li
                key={step.title}
                className={`grid gap-10 md:grid-cols-2 md:gap-20 lg:contents ${
                  photoLeftOnPhone ? "max-md:grid-cols-[110fr_233fr]" : "max-md:grid-cols-[233fr_110fr]"
                }`}
              >
                {step.imageFirst ? (
                  <>
                    {photo}
                    {card}
                  </>
                ) : (
                  <>
                    {card}
                    {photo}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
