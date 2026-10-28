import Image from "next/image";
import type { ProcessStep } from "./steps";

/** One step: rail node + number and name on the left, the screenshot in the middle, the copy and its output on the right.
 *  `ProcessTimeline` toggles `data-reached` / `data-active` on the `<li>`, which the node reads through `group-data-*`. */
export default function ProcessStepRow({ step, index }: { step: ProcessStep; index: number }) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <li
      data-step
      className="group relative flex flex-col gap-20 pl-48 lg:grid lg:grid-cols-[351fr_505fr_381fr] lg:gap-x-47 lg:gap-y-0 lg:pl-0"
    >
      <span
        data-node
        aria-hidden="true"
        className="border-border bg-surface-subtle group-data-reached:border-action-primary group-data-reached:bg-action-primary group-data-active:ring-action-primary/20 absolute top-0 left-0 z-10 grid size-28 place-items-center rounded-full border-4 transition-colors duration-200 group-data-active:ring-6 motion-reduce:transition-none lg:top-2 lg:size-40"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-14 text-white opacity-0 transition-opacity duration-200 group-data-active:opacity-100 motion-reduce:transition-none lg:size-20"
        >
          <path d="M2.5 6h19L12 19z" />
        </svg>
      </span>

      <div className="lg:pl-89">
        <p className="type-caption-12 text-fg-muted">
          <span aria-hidden="true">/</span>
          {number}
        </p>
        <h3 className="type-heading-28 text-fg-strong tracking-tight lg:mt-6">{step.name}</h3>
      </div>

      <div className="rounded-16 relative aspect-4/3 overflow-hidden lg:aspect-auto lg:h-395">
        <Image
          src={step.image}
          alt={`${step.name}: ${step.title}`}
          fill
          sizes="(min-width: 1024px) 505px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-32 lg:justify-between lg:gap-24">
        <div>
          <h4 className="type-heading-28 text-fg-strong max-w-340 tracking-tight">{step.title}</h4>
          <p className="type-body-17 text-fg-primary mt-16">{step.description}</p>
          <ul className="mt-20 flex flex-wrap gap-10">
            {step.tags.map((tag) => (
              <li key={tag} className="type-body-14 rounded-6 bg-surface text-fg-strong flex h-30 items-center px-16">
                {tag}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-border max-w-345 border-t pt-16">
          <p className="type-caption-12 text-fg-muted uppercase">Output</p>
          <p className="type-body-16 text-fg-strong mt-6 font-medium">{step.output}</p>
        </div>
      </div>
    </li>
  );
}
