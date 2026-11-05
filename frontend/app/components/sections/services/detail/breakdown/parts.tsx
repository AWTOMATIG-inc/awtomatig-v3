import type { ReactNode } from "react";
import { DatabaseIcon } from "@/app/components/icons";

// Entrance of a piece of a mockup: it rises and fades in when its card scrolls into view (MockupStage sets `data-shown`);
// reduced motion shows the finished state
export const ENTER =
  "ease-out-quint motion-safe:translate-y-30 motion-safe:opacity-0 motion-safe:transition-[opacity,translate] motion-safe:duration-1000 motion-safe:group-data-shown:translate-y-0 motion-safe:group-data-shown:opacity-100";

export const delay = (ms: number) => ({ transitionDelay: `${ms}ms` });

const DOT = { warning: "bg-status-warning", live: "bg-action-primary" } as const;

export type Tone = keyof typeof DOT;

/** Status dot and label at the right of a row */
export function Status({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="type-caption-12 flex items-center gap-5">
      <span className={`size-5 rounded-full ${DOT[tone]}`} />
      {label}
    </span>
  );
}

/** The "•••" menu mark */
export function Kebab() {
  return (
    <span aria-hidden="true" className="flex w-18 justify-between">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-3.5 rounded-full bg-black/75" />
      ))}
    </span>
  );
}

/** A white row of a list panel: a database tile, a title with a caption, and whatever sits at the right */
export function ListRow({
  title,
  caption,
  right,
  index,
}: {
  title: string;
  caption: string;
  right: ReactNode;
  /** Position in the list, for the stagger */
  index: number;
}) {
  return (
    <li style={delay(150 + index * 130)} className={`${ENTER} rounded-8 bg-surface flex h-55 items-center gap-14 pr-19 pl-8`}>
      <span className="rounded-6 bg-surface-subtle grid size-34 shrink-0 place-items-center">
        <DatabaseIcon className="size-17" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-body-14 text-fg-strong block leading-tight">{title}</span>
        <span className="type-caption-12 mt-2 block text-black/40">{caption}</span>
      </span>
      {right}
    </li>
  );
}

/** Three rows in the 420×253 frame, 11px apart */
export function RowList({ children }: { children: ReactNode }) {
  return <ul className="absolute inset-x-34 top-33 flex flex-col gap-11">{children}</ul>;
}
