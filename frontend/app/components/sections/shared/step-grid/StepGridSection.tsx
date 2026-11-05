import Image from "next/image";
import { Eyebrow } from "@/app/components/ui";
import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";

export type GridStep = {
  title: string;
  description: string;
  image: StaticImageData;
  /** On desktop the photo comes before its text card (first row) or after it (second row) */
  imageFirst: boolean;
};

function Photo({ step, className = "" }: { step: GridStep; className?: string }) {
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

function StepCard({ step, number, className = "" }: { step: GridStep; number: number; className?: string }) {
  return (
    <div className={`rounded-16 bg-surface-subtle flex flex-col p-20 max-md:min-h-211 md:p-24 lg:h-296 lg:pb-20 ${className}`}>
      <span className="type-body-14 md:type-body-16 rounded-8 bg-surface grid size-40 place-items-center text-black/60 md:size-48">
        {String(number).padStart(2, "0")}.
      </span>
      <h3 className="type-heading-20 md:type-heading-28 mt-auto pt-24 tracking-tight md:pt-32">{step.title}</h3>
      <p className="type-body-14 md:type-body-16 text-fg-primary mt-8 max-w-266">{step.description}</p>
    </div>
  );
}

type StepGridSectionProps = {
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  /** Optional muted paragraph at the right end of the heading row (bottom-aligned with the title) */
  lead?: ReactNode;
  steps: GridStep[];
};

// Four steps as a checkerboard of photos and numbered text cards (two rows of four on desktop); About "Growing with the work"
// and the service detail "What changes".
// On phones every step is one row (photo narrow, card wide), alternating sides: 1 and 3 photo-left, 2 and 4 photo-right.
export default function StepGridSection({ id, eyebrow, title, lead, steps }: StepGridSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-surface text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-116 lg:pb-119">
        <div className={`grid gap-20 lg:gap-0 ${lead ? "lg:grid-cols-[317fr_668fr_335fr]" : "lg:grid-cols-[317fr_1014fr]"}`}>
          <Eyebrow className="self-start lg:mt-8">{eyebrow}</Eyebrow>
          <h2 id={`${id}-title`} className="type-heading-60">
            {title}
          </h2>
          {lead && <p className="type-body-16 text-fg-muted lg:self-end">{lead}</p>}
        </div>

        {/* Desktop: each li is two grid cells, in DOM order (photo first in row 1, card first in row 2) */}
        <ol className="mt-50 grid gap-20 md:gap-40 lg:mt-65 lg:grid-cols-4 lg:gap-20">
          {steps.map((step, i) => {
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
