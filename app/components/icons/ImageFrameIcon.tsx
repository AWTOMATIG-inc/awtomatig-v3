import type { SVGProps } from "react";

// Framed picture: sun dot and a hill (web / media)
export default function ImageFrameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="9.5" r="1.6" fill="currentColor" />
      <path d="m4 17 4.5-4.2a1.2 1.2 0 0 1 1.6 0l2.4 2.2 2.6-2.8a1.2 1.2 0 0 1 1.7 0L20 15.5V17H4Z" fill="currentColor" />
    </svg>
  );
}
