import type { SVGProps } from "react";

// Two stacked cards, the back one peeking out behind the front; inherits the text color
export default function CardsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M7 4.5h11A2.5 2.5 0 0 1 20.5 7v8.5H18.6V7a.6.6 0 0 0-.6-.6H7V4.5Z" fill="currentColor" />
      <rect x="3.5" y="8" width="14" height="11.5" rx="2.2" fill="currentColor" />
    </svg>
  );
}
