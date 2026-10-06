import type { SVGProps } from "react";

// Filled single person (head and shoulders); inherits the text color
export default function PersonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4.5 20v-1.2c0-3 3.4-5.3 7.5-5.3s7.5 2.3 7.5 5.3V20h-15Z" />
    </svg>
  );
}
