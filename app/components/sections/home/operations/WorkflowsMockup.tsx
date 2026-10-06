import type { ComponentType, SVGProps } from "react";
import { CloudIcon, DatabaseIcon, MailFilledIcon, TableIcon } from "@/app/components/icons";

// Numbered hand-offs, each with its own tool icon; every other step is pushed right and one is knocked askew
const STEPS: { label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; className: string }[] = [
  { label: "Copy customer data", icon: DatabaseIcon, className: "" },
  { label: "Update CRM", icon: CloudIcon, className: "ml-12 -rotate-4" },
  { label: "Email Manager", icon: MailFilledIcon, className: "" },
  { label: "Update Spreadsheet", icon: TableIcon, className: "ml-12" },
];

export default function WorkflowsMockup() {
  return (
    <ol className="flex flex-col gap-10 pt-31 pl-18">
      {STEPS.map(({ label, icon: Icon, className }, i) => (
        <li
          key={label}
          className={`type-body-14 flex h-40 w-259 items-center gap-14 rounded-8 bg-surface pr-3 pl-16 text-fg-primary ${className}`}
        >
          <span>{String(i + 1).padStart(2, "0")}.</span>
          <span>{label}</span>
          <span className="ml-auto grid size-34 place-items-center rounded-6 bg-surface-subtle">
            <Icon className="size-18" />
          </span>
        </li>
      ))}
    </ol>
  );
}
