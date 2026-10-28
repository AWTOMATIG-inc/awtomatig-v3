import type { SVGProps } from "react";

// Filled cloud; inherits the text color
export default function CloudIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.75 19.5h11a4.75 4.75 0 0 0 .7-9.45 6.5 6.5 0 0 0-12.4 1.2A4.13 4.13 0 0 0 6.75 19.5Z" />
    </svg>
  );
}
