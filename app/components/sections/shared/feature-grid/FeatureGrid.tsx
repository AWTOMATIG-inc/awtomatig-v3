import type { ComponentType, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Feature = { title: string; description: string; icon: Icon };

// Dividers from md up are pseudo-elements on the cells, so rows can grow independently: a full-height line left of
// the right column, and a hairline above the second row inset 21px from the card edges.
const CELL_DIVIDERS = [
  "",
  "md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px md:before:bg-surface-subtle",
  "md:after:absolute md:after:top-0 md:after:right-0 md:after:left-21 md:after:h-px md:after:bg-surface-subtle",
  "md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px md:before:bg-surface-subtle md:after:absolute md:after:top-0 md:after:right-21 md:after:left-0 md:after:h-px md:after:bg-surface-subtle",
];

type FeatureGridProps = {
  features: Feature[];
  /** Max width of each description, which makes it wrap like the design (e.g. `max-w-400`) */
  descriptionClassName?: string;
};

/** White rounded card with a 2×2 grid of numbered features: icon tile, 01–04 number, title and description at the
 *  bottom of each cell (Services "One operating ecosystem", About "How we think"; DESIGN.md §10.4). */
export default function FeatureGrid({ features, descriptionClassName = "max-w-350" }: FeatureGridProps) {
  return (
    <ul className="grid overflow-hidden rounded-16 bg-surface md:grid-cols-2">
      {features.map((feature, i) => (
        <li
          key={feature.title}
          className={`relative flex flex-col px-20 pt-32 pb-32 max-md:not-first:border-t max-md:not-first:border-surface-subtle md:min-h-230 md:px-34 md:pt-34 md:pb-30 ${CELL_DIVIDERS[i]}`}
        >
          <div className="flex items-start justify-between">
            <span className="grid size-48 place-items-center rounded-8 bg-surface-subtle">
              <feature.icon className="size-28" />
            </span>
            <span className="type-heading-20 -mt-5 font-normal text-black/40">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <h3 className="type-heading-28 mt-40 tracking-tight md:mt-auto md:pt-20">{feature.title}</h3>
          <p className={`type-body-16 mt-8 ${descriptionClassName}`}>{feature.description}</p>
        </li>
      ))}
    </ul>
  );
}
