import type { SVGProps } from "react";

// Clutch mark: a dark open ring with a red dot in the middle
export default function ClutchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M19.4 7.6A8.6 8.6 0 1 0 19.4 16.4" fill="none" stroke="#17313b" strokeWidth="4" />
      <circle cx="12" cy="12" r="3.4" fill="#ef4335" />
    </svg>
  );
}
