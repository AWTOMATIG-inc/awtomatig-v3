import type { SVGProps } from "react";

// Three solid bars standing on a baseline; inherits the text color
export default function ChartBarsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="5" y="9.5" width="3.4" height="9" rx="0.4" />
      <rect x="10.3" y="3.5" width="3.4" height="15" rx="0.4" />
      <rect x="15.6" y="12.5" width="3.4" height="6" rx="0.4" />
      <rect x="3" y="19.7" width="18" height="1.6" rx="0.8" />
    </svg>
  );
}
