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

const DOTS = [
  { cx: 170, cy: 65, className: "fill-black/20" },
  { cx: 58, cy: 85, className: "fill-cyan" },
  { cx: 120, cy: 190, className: "fill-cyan" },
  { cx: 265, cy: 117, className: "fill-status-error" },
  { cx: 150, cy: 225, className: "fill-status-error" },
];

export default function SystemsMockup() {
  return (
    <>
      <svg viewBox="0 0 309 253" className="absolute inset-0 size-full" fill="none">
        <defs>
          {LINKS.map((d, i) => (
            <mask key={d} id={`systems-link-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="309" height="253">
              <path
                d={d}
                pathLength="1"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="1"
                style={{ transitionDelay: `${450 + i * 160}ms` }}
                className="ease-out-quint [stroke-dashoffset:0] motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:[stroke-dashoffset:1] motion-safe:group-data-shown:[stroke-dashoffset:0]"
              />
            </mask>
          ))}
        </defs>
        {LINKS.map((d, i) => (
          <path
            key={d}
            d={d}
            mask={`url(#systems-link-${i})`}
            className="stroke-black/20"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        ))}
        {DOTS.map(({ cx, cy, className }, i) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="4.5"
            style={{ transitionDelay: `${1100 + i * 140}ms`, animationDelay: `${1900 + i * 260}ms` }}
            className={`${className} motion-safe:group-data-shown:animate-dot-blink motion-safe:opacity-0 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:group-data-shown:opacity-100`}
          />
        ))}
      </svg>
      {CHIPS.map(({ label, icon: Icon, className }, i) => (
        <span
          key={label}
          style={{ transitionDelay: `${i * 90}ms` }}
          className={`type-caption-12 rounded-8 bg-surface text-fg-primary absolute flex h-30 items-center gap-4 px-12 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-safe:scale-70 motion-safe:opacity-0 motion-safe:transition-[opacity,scale] motion-safe:duration-700 motion-safe:group-data-shown:scale-100 motion-safe:group-data-shown:opacity-100 ${className}`}
        >
          <Icon className="size-18" />
          {label}
        </span>
      ))}
    </>
  );
}
