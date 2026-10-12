import type { SVGProps } from "react";

// Solid browser window with three dots cut out of its title bar and a gear in a round notch at the bottom; inherits the text color
export default function WindowGearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3ZM6.4 6.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm3 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm3 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8ZM12 10.6a5.3 5.3 0 1 0 0 10.6 5.3 5.3 0 0 0 0-10.6Z"
        fill="currentColor"
      />
      <circle cx="12" cy="15.9" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeDasharray="1.6 1.6" />
      <path
        fillRule="evenodd"
        d="M12 13.1a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Zm0 1.7a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
