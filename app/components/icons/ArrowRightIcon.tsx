import type { SVGProps } from "react";

// Rightward arrow for "go to" buttons; inherits the text color
export default function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </svg>
  );
}
