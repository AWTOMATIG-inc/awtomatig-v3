import type { ComponentType, SVGProps } from "react";
import { BarChartIcon, CloudIcon, DatabaseIcon, StorefrontIcon, TableIcon } from "@/app/components/icons";

// Positions in the 421×293 design frame (spacing units follow mockup-scale)
const CHIPS: { label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; className: string }[] = [
  { label: "CRM", icon: CloudIcon, className: "top-39 left-34" },
  { label: "ERP", icon: DatabaseIcon, className: "top-47 left-302" },
  { label: "Spreadsheet", icon: TableIcon, className: "top-129 left-142" },
  { label: "Website", icon: StorefrontIcon, className: "top-201 left-38" },
  { label: "Reporting", icon: BarChartIcon, className: "top-201 left-259" },
];

// Dashed links between the tools; some end loose (red)
const LINKS = [
  "M118 58C150 60 166 76 166 129",
  "M301 65C272 62 246 66 236 78",
  "M236 78C226 92 214 108 212 129",
  "M80 87C70 110 50 135 54 155C58 180 85 190 96 201",
  "M142 147C112 147 103 160 104 201",
  "M279 149C300 149 320 138 344 139",
  "M191 166C190 195 180 222 150 225",
  "M259 219C235 219 214 228 214 244",
];

export default function SystemsMockup() {
  return (
    <>
      <svg viewBox="0 0 421 293" className="absolute inset-0 size-full" fill="none">
        {LINKS.map((d) => (
          <path key={d} d={d} className="stroke-black/20" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
        ))}
        <circle cx="236" cy="78" r="4.5" className="fill-black/20" />
        <circle cx="80" cy="87" r="4.5" className="fill-cyan" />
        <circle cx="150" cy="225" r="4.5" className="fill-cyan" />
        <circle cx="344" cy="139" r="4.5" className="fill-status-error" />
        <circle cx="214" cy="244" r="4.5" className="fill-status-error" />
      </svg>
      {CHIPS.map(({ label, icon: Icon, className }) => (
        <span
          key={label}
          className={`type-body-14 absolute flex h-36 items-center gap-6 rounded-8 bg-surface px-15 text-fg-primary ${className}`}
        >
          <Icon className="size-18" />
          {label}
        </span>
      ))}
    </>
  );
}
