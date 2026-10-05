import type { SVGProps } from "react";

// Filled storefront (website); inherits the text color
export default function StorefrontIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3.9 3.5h16.2l1.65 5.1a3.1 3.1 0 0 1-5.6 2.35 3.1 3.1 0 0 1-4.15 1.05A3.1 3.1 0 0 1 12 12a3.1 3.1 0 0 1-4.15-1.05A3.1 3.1 0 0 1 2.25 8.6L3.9 3.5Z" />
      <path fillRule="evenodd" d="M4 13.4a4.6 4.6 0 0 0 3.85-.45A4.6 4.6 0 0 0 12 14a4.6 4.6 0 0 0 4.15-1.05A4.6 4.6 0 0 0 20 13.4v7.1H4v-7.1Zm5 2.6v4.5h6V16H9Z" />
    </svg>
  );
}
