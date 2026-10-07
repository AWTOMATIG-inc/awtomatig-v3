import { Eyebrow } from "@/app/components/ui";
import StackCard from "./StackCard";
import { AREAS } from "./ecosystem";

// Dividers from md up are pseudo-elements on the cells, so rows can grow independently: a full-height line left of
// the right column, and a hairline above the second row inset 21px from the card edges.
const CELL_DIVIDERS = [
  "",
  "md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px md:before:bg-surface-subtle",
  "md:after:absolute md:after:top-0 md:after:right-0 md:after:left-21 md:after:h-px md:after:bg-surface-subtle",
  "md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px md:before:bg-surface-subtle md:after:absolute md:after:top-0 md:after:right-21 md:after:left-0 md:after:h-px md:after:bg-surface-subtle",
];

// Services page: how the four disciplines connect, with the People → Technology stack beside them
export default function EcosystemSection() {
  return (
    <section id="ecosystem" aria-labelledby="ecosystem-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-119 lg:pb-68">
        <div className="grid gap-20 lg:grid-cols-[371fr_960fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">One operating ecosystem</Eyebrow>
          <div>
            <h2 id="ecosystem-title" className="type-heading-60">
              Your systems don’t operate
              <br className="max-lg:hidden" /> independently. Neither do
              <br className="max-lg:hidden" /> our services.
            </h2>
            <p className="type-body-16 mt-20 max-w-640 lg:mt-16 lg:max-w-none">
              A website can feed a CRM. A CRM can trigger automation. ERP can connect finance
              <br className="max-lg:hidden" /> and operations. Advertising activity can feed reporting and customer systems. The
              <br className="max-lg:hidden" /> value is in how those pieces work together.
            </p>
          </div>
        </div>

        <div className="mt-40 grid gap-20 lg:mt-56 lg:grid-cols-[371fr_960fr] lg:items-start lg:gap-0">
          <StackCard />

          <ul className="grid overflow-hidden rounded-16 bg-surface md:grid-cols-2">
            {AREAS.map((area, i) => (
              <li
                key={area.title}
                className={`relative flex flex-col px-20 pt-32 pb-32 max-md:not-first:border-t max-md:not-first:border-surface-subtle md:min-h-230 md:px-34 md:pt-34 md:pb-30 ${CELL_DIVIDERS[i]}`}
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-48 place-items-center rounded-8 bg-surface-subtle">
                    <area.icon className="size-28" />
                  </span>
                  <span className="type-heading-20 -mt-5 font-normal text-black/40">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="type-heading-28 mt-40 tracking-tight md:mt-auto md:pt-20">{area.title}</h3>
                <p className="type-body-16 mt-8 max-w-350">{area.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
