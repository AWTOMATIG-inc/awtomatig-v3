import { Eyebrow } from "@/app/components/ui";
import AwlabsCard from "./AwlabsCard";
import { REASONS } from "./whyAwtomatig";

// Dividers from md up are pseudo-elements on the cells, so rows can grow independently: a full-height line left of
// the right column, and a hairline above the second row inset 21 / 22 from the card edges.
const CELL_DIVIDERS = [
  "",
  "md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px md:before:bg-surface-subtle",
  "md:after:absolute md:after:top-0 md:after:right-0 md:after:left-21 md:after:h-px md:after:bg-surface-subtle",
  "md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px md:before:bg-surface-subtle md:after:absolute md:after:top-0 md:after:right-22 md:after:left-0 md:after:h-px md:after:bg-surface-subtle",
];

export default function WhyAwtomatigSection() {
  return (
    <section id="why-awtomatig" aria-labelledby="why-awtomatig-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-116 lg:pb-73">
        <div className="grid gap-20 lg:grid-cols-[375fr_956fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">Why AWTOMATIG</Eyebrow>
          <h2 id="why-awtomatig-title" className="type-heading-60">
            Technical capability. <br className="max-lg:hidden" />
            Operational understanding.
          </h2>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-79 lg:grid-cols-[375fr_956fr] lg:items-start lg:gap-0">
          <AwlabsCard />

          <ul className="grid overflow-hidden rounded-16 bg-surface md:grid-cols-2">
            {REASONS.map((reason, i) => (
              <li
                key={reason.title}
                className={`relative flex flex-col px-20 pt-32 pb-28 max-md:not-first:border-t max-md:not-first:border-surface-subtle md:px-35 lg:min-h-261 ${CELL_DIVIDERS[i]}`}
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-48 place-items-center rounded-8 bg-surface-subtle">
                    <reason.icon className="size-28" />
                  </span>
                  <span className="type-body-16 text-black/40">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="type-heading-28 mt-40 lg:mt-58">{reason.title}</h3>
                <p className="type-body-16 mt-10 max-w-400 text-fg-primary">{reason.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
