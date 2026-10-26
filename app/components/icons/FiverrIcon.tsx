import type { HTMLAttributes } from "react";
import { RiFiverrFill } from "react-icons/ri";

// Fiverr mark (react-icons) in the brand green; fills the box its parent sizes, like the other rating logos
export default function FiverrIcon({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span aria-hidden="true" className={`inline-flex items-center justify-center rounded-full ${className}`} {...props}>
      <RiFiverrFill className="text-green size-full" />
    </span>
  );
}
