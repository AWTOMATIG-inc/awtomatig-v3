import type { ReactNode } from "react";

// Eleven bars rising to the right: a height class and a cyan strength (the first ones are barely visible) per bar
const BARS = [
  "h-15 bg-action-primary/20",
  "h-17 bg-action-primary/24",
  "h-21 bg-action-primary/30",
  "h-26 bg-action-primary/38",
  "h-34 bg-action-primary/46",
  "h-43 bg-action-primary/56",
  "h-52 bg-action-primary/68",
  "h-62 bg-action-primary/80",
  "h-75 bg-action-primary/90",
  "h-88 bg-action-primary",
  "h-99 bg-action-primary",
];

type GrowthCardProps = {
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  children: ReactNode;
};

/** Dark card with a statement over a hairline and eleven cyan bars growing to the right, lit by a glow from the
 *  bottom-right corner (service detail "Overview"). Same footprint as the Services stack card. */
export default function GrowthCard({ children }: GrowthCardProps) {
  return (
    <figure className="bg-growth-card rounded-12 text-fg-inverse flex h-291 w-full flex-col overflow-hidden px-24 pt-24 pb-18 lg:mr-16 lg:w-auto lg:max-w-280">
      <p className="type-heading-28 leading-none tracking-tight">{children}</p>
      <span aria-hidden="true" className="mt-22 h-px shrink-0 bg-white/12" />
      <div aria-hidden="true" className="mt-auto flex h-99 items-end gap-5">
        {BARS.map((bar) => (
          <span key={bar} className={`rounded-t-2 flex-1 ${bar}`} />
        ))}
      </div>
    </figure>
  );
}
