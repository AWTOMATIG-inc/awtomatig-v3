import type { ReactNode } from "react";
import { Eyebrow } from "@/app/components/ui";

export type ConnectedItem = { title: string; description: string };

type ConnectedSectionProps = {
  id: string;
  /** Use a `<br />` where the design wraps the label (it sits in a narrow column) */
  eyebrow: ReactNode;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  lead: ReactNode;
  /** Six cards: two rows of three on desktop */
  items: ConnectedItem[];
};

/** Service detail "Connected technology": off-white, eyebrow + Heading / 60 title with a short lead at the right, then
 *  numbered white cards (chip, then title and description pinned to the bottom) in a 3-column grid. */
export default function ConnectedSection({ id, eyebrow, title, lead, items }: ConnectedSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-90 lg:pb-90">
        <div className="grid gap-20 lg:grid-cols-[317fr_617fr_386fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-8">{eyebrow}</Eyebrow>
          <h2 id={`${id}-title`} className="type-heading-60">
            {title}
          </h2>
          <p className="type-body-15 text-fg-muted max-w-640 lg:max-w-none lg:self-end">{lead}</p>
        </div>

        <ol className="mt-40 grid gap-12 md:grid-cols-2 md:gap-20 lg:mt-80 lg:grid-cols-3">
          {items.map((item, i) => (
            <li
              key={item.title}
              className="rounded-16 bg-surface flex min-h-210 flex-col px-20 pt-24 pb-24 md:min-h-251 md:px-24 md:pt-28 md:pb-32"
            >
              <span className="type-body-14 rounded-8 bg-surface-subtle grid size-48 place-items-center text-black/60">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <h3 className="type-heading-20 mt-auto pt-24">{item.title}</h3>
              <p className="type-body-15 text-fg-primary mt-8 max-w-364">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
