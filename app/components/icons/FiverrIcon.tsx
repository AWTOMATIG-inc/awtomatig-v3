import type { SVGProps } from "react";

// Fiverr: a green disc with a white bold slab-serif "fi"
export default function FiverrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="12" fill="#1dbf73" />
      <g fill="#fff">
        <path d="M7.7 17.4V10.9H6.4V9.2h1.3v-.6C7.7 6.9 8.8 5.9 10.6 5.9c.8 0 1.4.1 1.8.3v1.8c-.3-.1-.6-.2-1-.2-.8 0-1.2.4-1.2 1.2v.2H12v1.7h-1.8v6.5h1.4v1.3H6.3v-1.3h1.4Z" />
        <path d="M12.5 9.2h3.9v6.9h1.3v1.3h-5.2v-1.3h1.4v-5.2h-1.4V9.2Z" />
        <circle cx="14.4" cy="7" r="1.5" />
      </g>
    </svg>
  );
}
