import type { ComponentType, SVGProps } from "react";
import { ChevronRightIcon } from "@/app/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const STATUS_DOT = {
  warning: "bg-status-warning",
  caution: "bg-status-caution",
} as const;

export type StatusRow = { label: string; status: string; tone: keyof typeof STATUS_DOT; icon: Icon };

type StatusListMockupProps = {
  title: string;
  subtitle: string;
  /** Optional pill at the top right, e.g. "4 Issues" */
  badge?: string;
  rows: StatusRow[];
};

// Dashboard-style list drawn 1:1 in the 309×253 panel frame: title block, optional pill, four white status rows
export default function StatusListMockup({ title, subtitle, badge, rows }: StatusListMockupProps) {
  return (
    <div className="px-20 pt-19">
      <div className="flex items-start justify-between">
        <div>
          <p className="type-heading-18 text-fg-strong">{title}</p>
          <p className="type-caption-12 text-black/60">{subtitle}</p>
        </div>
        {badge && (
          <span className="type-caption-12 mt-4 flex h-33 items-center gap-7 rounded-8 bg-surface px-16 text-fg-primary">
            <span className="size-6 rounded-full bg-status-warning" />
            {badge}
          </span>
        )}
      </div>
      <ul className="mt-15 flex flex-col gap-7">
        {rows.map(({ label, status, tone, icon: Icon }) => (
          <li key={label} className="type-caption-12 flex h-35 items-center rounded-8 bg-surface pr-11 pl-10 text-fg-primary">
            <span className="flex w-136 items-center gap-6">
              <Icon className="size-18 shrink-0" />
              {label}
            </span>
            <span className="flex items-center gap-6">
              <span className={`size-6 rounded-full ${STATUS_DOT[tone]}`} />
              {status}
            </span>
            <ChevronRightIcon className="ml-auto size-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}
