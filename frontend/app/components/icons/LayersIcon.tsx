import type { SVGProps } from "react";

// Filled stack of layers; inherits the text color
export default function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5 2.5 7.75 12 13l9.5-5.25L12 2.5Z" />
      <path d="m4.4 10.95-1.9 1.05L12 17.25 21.5 12l-1.9-1.05L12 15.15l-7.6-4.2Z" />
      <path d="m4.4 15.2-1.9 1.05L12 21.5l9.5-5.25-1.9-1.05L12 19.4l-7.6-4.2Z" />
    </svg>
  );
}
