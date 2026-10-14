import type { SVGProps } from "react";

// Fiverr: a green disc with a white "fi"
export default function FiverrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="12" fill="#1dbf73" />
      <path
        fill="#fff"
        d="M6.6 17.4v-6.5H5.3V8.9h1.3v-.5c0-2 1.1-3.1 3-3.1.4 0 .8 0 1.1.1v1.9c-.2 0-.4-.1-.7-.1-.7 0-1.1.3-1.1 1.1v.6h1.8v2H9.9v6.5H6.6Zm7.3 0v-8.5h3.3v8.5h-3.3Zm1.65-9.6a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z"
      />
    </svg>
  );
}
