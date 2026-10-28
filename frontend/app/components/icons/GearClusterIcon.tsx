import type { SVGProps } from "react";

// A solid gear with two small outlined gears beside it; inherits the text color
export default function GearClusterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
      <circle cx="8.5" cy="15.5" r="3.7" strokeWidth="3.4" />
      <circle cx="8.5" cy="15.5" r="6.3" strokeWidth="2" strokeDasharray="2.35 2.35" />
      <circle cx="17" cy="7" r="2.1" strokeWidth="1.4" />
      <circle cx="17" cy="7" r="3.6" strokeWidth="1.3" strokeDasharray="1.35 1.35" />
      <circle cx="19" cy="15.5" r="1.7" strokeWidth="1.3" />
      <circle cx="19" cy="15.5" r="3" strokeWidth="1.2" strokeDasharray="1.15 1.15" />
    </svg>
  );
}
