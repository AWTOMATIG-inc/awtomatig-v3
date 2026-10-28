import type { SVGProps } from "react";

// Speech bubble with a gear cut out of it; inherits the text color
export default function ChatGearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M7 2.5h10A4.5 4.5 0 0 1 21.5 7v6.5a4.5 4.5 0 0 1-4.5 4.5h-3.2L9 21.8V18H7a4.5 4.5 0 0 1-4.5-4.5V7A4.5 4.5 0 0 1 7 2.5ZM12 6.6a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
      />
      <circle cx="12" cy="10.1" r="1.3" />
    </svg>
  );
}
