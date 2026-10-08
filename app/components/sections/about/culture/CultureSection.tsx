import Image from "next/image";
import CultureImage from "@/public/images/about/culture.png";
import { Eyebrow } from "@/app/components/ui";
import { CULTURE_VALUES } from "./culture";

// About page: four numbered values in a white card, with the design-system photo beside them
export default function CultureSection() {
  return (
    <section id="culture" aria-labelledby="culture-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-119 lg:pb-122">
        <div className="grid gap-20 lg:grid-cols-[306fr_647fr_378fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-5">Culture</Eyebrow>
          <h2 id="culture-title" className="type-heading-60">
            Serious about the
            <br className="max-lg:hidden" /> work. Human about
            <br className="max-lg:hidden" /> the process.
          </h2>
          <p className="type-body-16 max-w-400 text-fg-muted lg:translate-y-7 lg:self-end">
            We care about doing work properly without making the process unnecessarily complicated.
          </p>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-65 lg:grid-cols-[663fr_648fr]">
          <ol className="rounded-16 bg-surface px-24 py-8 lg:h-453 lg:px-40 lg:py-20">
            {CULTURE_VALUES.map((value, i) => (
              <li key={value.title} className="flex gap-16 py-20 not-last:border-b not-last:border-border lg:gap-0">
                <span className="type-heading-24 w-36 shrink-0 font-normal tracking-tight text-black/40 lg:w-52">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                <div>
                  <h3 className="type-heading-24 tracking-tight">{value.title}</h3>
                  <p className="type-body-16 mt-6 text-fg-primary">{value.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="relative aspect-4/3 overflow-hidden rounded-16 lg:aspect-auto lg:h-453">
            <Image
              src={CultureImage}
              alt="Snaillia design system: brand colors, typography, UI controls and product card"
              fill
              sizes="(min-width: 1024px) 648px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
