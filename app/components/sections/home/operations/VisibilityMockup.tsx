import { ChevronRightIcon, DatabaseIcon } from "@/app/components/icons";

const STATUS_DOT = {
  warning: "bg-status-warning",
  caution: "bg-status-caution",
} as const;

const ROWS: { label: string; status: string; tone: keyof typeof STATUS_DOT }[] = [
  { label: "Task ownership", status: "Unknown", tone: "warning" },
  { label: "Approval queue", status: "Delayed", tone: "warning" },
  { label: "Reporting status", status: "Incomplete", tone: "warning" },
  { label: "System sync", status: "Needs review", tone: "caution" },
];

export default function VisibilityMockup() {
  return (
    <div className="px-25 pt-22">
      <div className="flex items-start justify-between">
        <div>
          <p className="type-heading-18 text-fg-strong">Operations</p>
          <p className="type-body-14 mt-2 text-black/60">Live system status</p>
        </div>
        <span className="type-body-14 mt-8 flex h-37 items-center gap-6 rounded-8 bg-surface pr-16 pl-14 text-fg-primary">
          <span className="size-8 rounded-full bg-status-warning" />4 Issues
        </span>
      </div>
      <ul className="mt-16 flex flex-col gap-7">
        {ROWS.map((row) => (
          <li key={row.label} className="type-body-14 flex h-40 items-center rounded-8 bg-surface pr-16 pl-13 text-fg-primary">
            <span className="flex w-190 items-center gap-5">
              <DatabaseIcon className="size-20" />
              {row.label}
            </span>
            <span className="flex items-center gap-8">
              <span className={`size-8 rounded-full ${STATUS_DOT[row.tone]}`} />
              {row.status}
            </span>
            <ChevronRightIcon className="ml-auto size-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}
