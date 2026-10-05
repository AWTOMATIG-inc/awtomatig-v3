import type { SVGProps } from "react";

// Filled bar chart; inherits the text color
export default function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="4" y="10" width="3.5" height="10" rx="0.5" />
      <rect x="10.25" y="4" width="3.5" height="16" rx="0.5" />
      <rect x="16.5" y="13" width="3.5" height="7" rx="0.5" />
    </svg>
  );
}
