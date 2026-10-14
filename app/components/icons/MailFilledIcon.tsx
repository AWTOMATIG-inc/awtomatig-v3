import type { SVGProps } from "react";

// Solid envelope with a cut-out flap; inherits the text color
export default function MailFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M4 4.5h16A1.5 1.5 0 0 1 21.5 6v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V6A1.5 1.5 0 0 1 4 4.5Zm.2 2.1L12 12.4l7.8-5.8-.9-1.2L12 10.5 5.1 5.4l-.9 1.2Z"
      />
    </svg>
  );
}
