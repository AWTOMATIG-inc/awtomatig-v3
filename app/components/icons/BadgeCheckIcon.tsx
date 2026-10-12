import type { SVGProps } from "react";

// Filled scalloped seal with a check cut out of it; inherits the text color
export default function BadgeCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M12 2.2l2.3 1.7 2.8-.1 1 2.7 2.4 1.5-.8 2.7 1.1 2.6-1.9 2.1-.4 2.8-2.8.7-1.6 2.4L12 20.8l-2.6 1.1-1.6-2.4-2.8-.7-.4-2.8-1.9-2.1 1.1-2.6-.8-2.7L5.9 6.5l1-2.7 2.8.1L12 2.2Zm4 6.9-5 5-2.3-2.3-1.3 1.3 3.6 3.6 6.3-6.3-1.3-1.3Z"
        fill="currentColor"
      />
    </svg>
  );
}
