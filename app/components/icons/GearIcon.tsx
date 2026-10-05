import type { SVGProps } from "react";

// Filled settings gear with a cut-out hub; inherits the text color
export default function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M19.07 9.81 21.8 10a10 10 0 0 1 0 3.98l-2.73.2a7.4 7.4 0 0 1-.52 1.26l1.78 2.08a10 10 0 0 1-2.8 2.8l-2.08-1.78a7.4 7.4 0 0 1-1.26.52l-.2 2.73a10 10 0 0 1-3.98 0l-.2-2.73a7.4 7.4 0 0 1-1.26-.52l-2.08 1.78a10 10 0 0 1-2.8-2.8l1.78-2.08a7.4 7.4 0 0 1-.52-1.26L2.2 14a10 10 0 0 1 0-3.98l2.73-.2a7.4 7.4 0 0 1 .52-1.26L3.67 6.47a10 10 0 0 1 2.8-2.8l2.08 1.78a7.4 7.4 0 0 1 1.26-.52L10 2.2a10 10 0 0 1 3.98 0l.2 2.73a7.4 7.4 0 0 1 1.26.52l2.08-1.78a10 10 0 0 1 2.8 2.8l-1.78 2.08c.22.4.4.82.52 1.26ZM12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
      />
    </svg>
  );
}
