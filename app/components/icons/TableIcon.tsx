import type { SVGProps } from "react";

// Outline spreadsheet grid; inherits the text color
export default function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.25" y="4.25" width="17.5" height="15.5" rx="1.75" stroke="currentColor" strokeWidth="2" />
      <path d="M3.25 9.5h17.5M3.25 14.5h17.5M9.25 9.5v10.25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
