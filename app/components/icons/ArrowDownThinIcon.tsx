import type { SVGProps } from "react";

// Thin, tall downward arrow (a "leads to" connector between stacked chips); inherits the text color. 8×14 box.
export default function ArrowDownThinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" {...props}>
      <path d="M4 0.5v12.5M0.75 9.75 4 13l3.25-3.25" />
    </svg>
  );
}
