import type { SVGProps } from "react";

// Solid play triangle with rounded corners; its centroid sits on the box centre so it looks centred in a circle
export default function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M8.9 5.6 19.4 12 8.9 18.4Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
