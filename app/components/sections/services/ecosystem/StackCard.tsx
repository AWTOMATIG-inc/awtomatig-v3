import { Fragment } from "react";
import { ArrowDownThinIcon } from "@/app/components/icons";
import { LAYERS } from "./ecosystem";

// Dark card showing People → Process → Systems → Technology as a centred column of chips
export default function StackCard() {
  return (
    <figure className="bg-ecosystem-card flex h-364 w-full flex-col items-center justify-center overflow-hidden rounded-12 text-fg-inverse lg:mr-16 lg:w-auto lg:max-w-278">
      <figcaption className="sr-only">People, process, systems and technology, layered on each other</figcaption>
      {LAYERS.map((layer, i) => (
        <Fragment key={layer.label}>
          {i > 0 && (
            <span aria-hidden="true" className="flex h-39 items-center text-white/60">
              <ArrowDownThinIcon className="h-14 w-8" />
            </span>
          )}
          <span aria-hidden="true" className="type-body-14 flex h-37 items-center gap-8 rounded-6 border border-white/20 bg-linear-to-b from-black/40 to-black/12 px-16">
            <layer.icon className="size-16 shrink-0" />
            {layer.label}
          </span>
        </Fragment>
      ))}
    </figure>
  );
}
