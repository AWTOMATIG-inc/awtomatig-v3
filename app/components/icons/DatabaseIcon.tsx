import type { SVGProps } from "react";

// Filled database cylinder in three bands; inherits the text color
export default function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5c-4.7 0-8.5 1.5-8.5 3.4v2.3c0 1.9 3.8 3.4 8.5 3.4s8.5-1.5 8.5-3.4V5.9c0-1.9-3.8-3.4-8.5-3.4Z" />
      <path d="M3.5 11v2.75c0 1.9 3.8 3.4 8.5 3.4s8.5-1.5 8.5-3.4V11c-1.7 1.3-5 2.1-8.5 2.1S5.2 12.3 3.5 11Z" />
      <path d="M3.5 16.55v1.55c0 1.9 3.8 3.4 8.5 3.4s8.5-1.5 8.5-3.4v-1.55c-1.7 1.3-5 2.1-8.5 2.1s-6.8-.8-8.5-2.1Z" />
    </svg>
  );
}
