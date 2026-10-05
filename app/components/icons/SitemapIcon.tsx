import type { SVGProps } from "react";

// Org chart: one node above two, joined by connector lines; inherits the text color
export default function SitemapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="9.3" y="3" width="5.4" height="5.4" rx=".6" />
      <rect x="3.6" y="15.6" width="5.4" height="5.4" rx=".6" />
      <rect x="15" y="15.6" width="5.4" height="5.4" rx=".6" />
      <path d="M11.3 8.4h1.4v3.4h5v4h-1.4v-2.6h-9.6v2.6H5.3v-4h5.7Z" />
    </svg>
  );
}
