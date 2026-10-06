import type { ComponentType, SVGProps } from "react";
import { BarChartIcon, CloudIcon, DatabaseIcon, StorefrontIcon, TableIcon } from "@/app/components/icons";

// Positions in the 309×253 design frame (spacing units follow mockup-scale)
const CHIPS: { label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; className: string }[] = [
  { label: "CRM", icon: CloudIcon, className: "top-23 left-27" },
  { label: "ERP", icon: DatabaseIcon, className: "top-37 left-206" },
  { label: "Spreadsheet", icon: TableIcon, className: "top-109 left-92" },
  { label: "Website", icon: StorefrontIcon, className: "top-174 left-20" },
  { label: "Reporting", icon: BarChartIcon, className: "top-179 left-179" },
];

// Dashed links between the tools; some end loose (red)
const LINKS = [
  "M104 42C124 44 134 54 134 80L134 108",
  "M207 53C188 53 173 58 170 65C160 76 156 90 156 109",
  "M91 123C80 124 75 132 75 142L76 174",
  "M58 85C48 100 38 118 39 138C40 155 55 165 64 174",
  "M144 145C144 160 144 172 138 181C133 188 126 190 120 190",
  "M214 127C230 129 245 123 265 117",
  "M180 196C162 197 152 210 150 225",
];

export default function SystemsMockup() {
  return (
    <>
      <svg viewBox="0 0 309 253" className="absolute inset-0 size-full" fill="none">
        {LINKS.map((d) => (
          <path key={d} d={d} className="stroke-black/20" strokeWidth="1.2" strokeDasharray="4 4" strokeLinecap="round" />
        ))}
        <circle cx="170" cy="65" r="4.5" className="fill-black/20" />
        <circle cx="58" cy="85" r="4.5" className="fill-cyan" />
        <circle cx="120" cy="190" r="4.5" className="fill-cyan" />
        <circle cx="265" cy="117" r="4.5" className="fill-status-error" />
        <circle cx="150" cy="225" r="4.5" className="fill-status-error" />
      </svg>
      {CHIPS.map(({ label, icon: Icon, className }) => (
        <span
          key={label}
          className={`type-caption-12 absolute flex h-30 items-center gap-4 rounded-8 bg-surface px-12 text-fg-primary ${className}`}
        >
          <Icon className="size-18" />
          {label}
        </span>
      ))}
    </>
  );
}
