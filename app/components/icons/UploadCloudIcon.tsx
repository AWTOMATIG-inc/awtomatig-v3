import type { SVGProps } from "react";

// Cloud with an upward arrow (file upload); inherits the text color
export default function UploadCloudIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 17.5H6.5a4 4 0 0 1-.6-7.96 6 6 0 0 1 11.7-.9A4.5 4.5 0 0 1 17.5 17.5H17M12 20v-8m0 0-3 3m3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
