import type { SVGProps } from "react";

// Filled speech bubble with three dots cut out; inherits the text color
export default function ChatBubbleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M12 1.5C6.2 1.5 1.5 5.9 1.5 11.3c0 2.5 1 4.8 2.7 6.5-.2 1.6-.9 3.1-2 4.2a.5.5 0 0 0 .4.8c2.2 0 4-.7 5.3-1.6 1.3.5 2.6.7 4.1.7 5.8 0 10.5-4.4 10.5-9.8S17.8 1.5 12 1.5ZM7.5 12.6a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm4.5 0a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm4.5 0a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z"
      />
    </svg>
  );
}
