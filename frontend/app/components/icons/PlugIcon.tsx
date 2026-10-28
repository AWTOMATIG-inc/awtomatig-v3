import type { SVGProps } from "react";

// Two plug halves meeting on the diagonal ("connect"); inherits the text color
export default function PlugIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <g transform="rotate(-45 12 12)">
        <path d="M10.5 7.5H8A3.5 3.5 0 0 0 4.5 11v2A3.5 3.5 0 0 0 8 16.5h2.5Z" />
        <path d="M13.5 7.5H16a3.5 3.5 0 0 1 3.5 3.5v2a3.5 3.5 0 0 1-3.5 3.5h-2.5Z" />
        <path d="M10.5 9.2h2.4v1.6h-2.4Zm0 4h2.4v1.6h-2.4Z" />
        <path d="M0.8 12h3.7M19.5 12h3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
