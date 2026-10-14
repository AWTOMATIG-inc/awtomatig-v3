import type { SVGProps } from "react";

// Outlined database: a top disc over two bands; inherits the text color
export default function DatabaseOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="12" cy="6.5" rx="8" ry="3" />
      <path d="M4 6.5v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5M4 11.5v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5" />
    </svg>
  );
}
