import type { SVGProps } from "react";

// Three-quarter progress ring; inherits the text color
export default function ProgressIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 4.5a7.5 7.5 0 1 1-7.5 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
