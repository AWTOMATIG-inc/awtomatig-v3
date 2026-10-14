import type { SVGProps } from "react";

// Filled briefcase with a handle and a clasp; inherits the text color
export default function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6h-1.8V4.8h-2.4V6H9V4.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        d="M5 6.5h14a2 2 0 0 1 2 2v3.2a.8.8 0 0 1-.6.8L13 14.4V13.5h-2v.9l-7.4-1.9a.8.8 0 0 1-.6-.8V8.5a2 2 0 0 1 2-2Z"
        fill="currentColor"
      />
      <path d="M3 14.6 11 16.4v1.1h2v-1.1l8-1.8V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.4Z" fill="currentColor" />
    </svg>
  );
}
