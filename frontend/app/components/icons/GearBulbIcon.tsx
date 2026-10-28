import type { SVGProps } from "react";

// Solid gear whose hub is cut out around a small bulb; inherits the text color
export default function GearBulbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M19.07 9.81 21.8 10a10 10 0 0 1 0 3.98l-2.73.2a7.4 7.4 0 0 1-.52 1.26l1.78 2.08a10 10 0 0 1-2.8 2.8l-2.08-1.78a7.4 7.4 0 0 1-1.26.52l-.2 2.73a10 10 0 0 1-3.98 0l-.2-2.73a7.4 7.4 0 0 1-1.26-.52l-2.08 1.78a10 10 0 0 1-2.8-2.8l1.78-2.08a7.4 7.4 0 0 1-.52-1.26L2.2 14a10 10 0 0 1 0-3.98l2.73-.2a7.4 7.4 0 0 1 .52-1.26L3.67 6.47a10 10 0 0 1 2.8-2.8l2.08 1.78a7.4 7.4 0 0 1 1.26-.52L10 2.2a10 10 0 0 1 3.98 0l.2 2.73a7.4 7.4 0 0 1 1.26.52l2.08-1.78a10 10 0 0 1 2.8 2.8l-1.78 2.08c.22.4.4.82.52 1.26ZM12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z"
      />
      <path d="M12 9.6a2 2 0 0 1 1.2 3.6v.9h-2.4v-.9A2 2 0 0 1 12 9.6Zm-1 5h2v.8h-2Z" />
    </svg>
  );
}
