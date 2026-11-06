import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPlainDate } from "@/lib/format";
import {
  changeValue,
  EMPLOYMENT_TYPE_LABEL,
  employeeHref,
  FIELD_LABEL,
  formatPeriod,
  REASON_LABEL,
  salaryText,
  type TimelineBlock,
  WORK_MODE_LABEL,
} from "@/lib/hr/employees";

import { RemoveRecordButton } from "./RemoveRecordButton";

/** What the “to” end of a stint says: the last day, “Present” while it runs, or nothing for a change that has not started. */
function span(block: TimelineBlock): string {
  const from = formatPlainDate(block.effectiveFrom);
  if (block.status === "scheduled") return `From ${from}`;
  return `${from} – ${block.endsOn ? formatPlainDate(block.endsOn) : "Present"}`;
}

function describe(block: TimelineBlock): string {
  const date = formatPlainDate(block.effectiveFrom);
  const what =
    block.changes.length > 0 ? block.changes.map((change) => FIELD_LABEL[change.field].toLowerCase()).join(" and ") : null;
  return `${REASON_LABEL[block.reason]}, ${date}${what ? ` (${what})` : ""}.`;
}

/**
 * The career timeline, newest first: one block per stint with its from and to dates, how long it lasted and what changed from the
 * stint before. The solid dot marks the stint in force now, a dashed one a change that has not started yet. A “Correction” is
 * muted so a typo fix does not read as a career step. “Joined” is the last block and has no remove button.
 */
export function Timeline({
  employeeId,
  blocks,
  canUpdate,
}: {
  employeeId: string;
  blocks: readonly TimelineBlock[];
  canUpdate: boolean;
}) {
  return (
    <ol className="p-20 pt-16">
      {blocks.map((block, index) => {
        const last = index === blocks.length - 1;
        const muted = block.reason === "correction";
        return (
          <li key={block.id} className={cn("relative pb-24 pl-28", last && "pb-0", muted && "opacity-70")}>
            {!last && <span aria-hidden="true" className="border-border absolute top-18 bottom-0 left-6 border-l" />}
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-6 left-0 size-12 rounded-full border-2",
                block.status === "current" && "border-surface-inverse bg-surface-inverse",
                block.status === "past" && "border-surface-inverse bg-surface",
                block.status === "scheduled" && "border-surface-inverse bg-surface border-dashed",
              )}
            />
            <div className="flex flex-wrap items-start justify-between gap-12">
              <div className="min-w-0">
                <p className="type-body-14 text-fg-strong flex flex-wrap items-center gap-8 font-medium">
                  {block.designation}
                  {block.status === "current" && <StatusBadge>Current</StatusBadge>}
                  {block.status === "scheduled" && <StatusBadge>Scheduled</StatusBadge>}
                </p>
                <p className="type-body-14 text-fg-muted">
                  {[EMPLOYMENT_TYPE_LABEL[block.employmentType], WORK_MODE_LABEL[block.workMode], block.department?.name]
                    .filter(Boolean)
                    .join(" · ")}
                  {block.manager && (
                    <>
                      {" · Manager: "}
                      <Link href={employeeHref(block.manager.id)} className="ease-out-quint underline-offset-4 hover:underline">
                        {block.manager.fullName}
                      </Link>
                    </>
                  )}
                </p>
                <p className="type-body-14 text-fg-primary tabular-nums">
                  {span(block)}
                  {block.period && ` · ${formatPeriod(block.period)}`}
                </p>
              </div>
              <div className="flex items-center gap-12">
                {block.salary !== undefined && (
                  <p className="type-body-14 text-fg-strong text-right tabular-nums">
                    {block.salary === null ? <span className="text-fg-muted">Salary not set</span> : salaryText(block.salary)}
                  </p>
                )}
                {canUpdate && block.reason !== "joined" && (
                  <RemoveRecordButton employeeId={employeeId} recordId={block.id} description={describe(block)} />
                )}
              </div>
            </div>
            <p className="type-body-14 text-fg-muted mt-6">
              <span className="text-fg-primary">{REASON_LABEL[block.reason]}</span>
              {block.changes.map((change) => (
                <span key={change.field}>
                  {" · "}
                  {FIELD_LABEL[change.field]}: {changeValue(change.field, change.from)} → {changeValue(change.field, change.to)}
                </span>
              ))}
              {block.note && <span> · “{block.note}”</span>}
              {block.recordedBy && <span> · recorded by {block.recordedBy}</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
