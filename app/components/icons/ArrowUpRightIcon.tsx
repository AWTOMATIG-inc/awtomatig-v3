import type { SVGProps } from "react";

// Diagonal arrow for "go to" links; inherits the text color
export default function ArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true" {...props}>
      <path d="M5.5 18.5 18.5 5.5M8 5.5h10.5V16" />
    </svg>
  );
}
