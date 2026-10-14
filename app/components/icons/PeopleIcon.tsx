import type { SVGProps } from "react";

// Filled group of three people; inherits the text color
export default function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.75 18.5v-.9c0-2.3 2.8-4.1 6.25-4.1s6.25 1.8 6.25 4.1v.9H5.75Z" />
      <circle cx="5" cy="9.75" r="2.25" />
      <circle cx="19" cy="9.75" r="2.25" />
      <path d="M1 18.5v-.6c0-1.6 1.4-2.8 3.4-3.1a5 5 0 0 0-.9 2.8v.9H1Zm22 0v-.6c0-1.6-1.4-2.8-3.4-3.1a5 5 0 0 1 .9 2.8v.9H23Z" />
    </svg>
  );
}
