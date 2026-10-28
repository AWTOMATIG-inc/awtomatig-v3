import type { SVGProps } from "react";

// Outline envelope; inherits the text color
export default function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
