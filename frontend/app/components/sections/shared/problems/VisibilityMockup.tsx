import { BarChartIcon, DatabaseIcon, PersonIcon } from "@/app/components/icons";
import type { PanelCopy } from "./problems";
import StatusListMockup, { type StatusRow } from "./StatusListMockup";

const ROWS: StatusRow[] = [
  { label: "Task ownership", status: "Unknown", tone: "warning", icon: PersonIcon },
  { label: "Approval queue", status: "Delayed", tone: "warning", icon: DatabaseIcon },
  { label: "Reporting status", status: "Incomplete", tone: "warning", icon: BarChartIcon },
  { label: "System sync", status: "Needs review", tone: "caution", icon: DatabaseIcon },
];

export default function VisibilityMockup({ panel }: { panel?: PanelCopy }) {
  const rows = panel ? ROWS.map((row, i) => ({ ...row, ...panel.rows[i] })) : ROWS;
  return (
    <StatusListMockup
      title={panel?.title ?? "Operations"}
      subtitle={panel?.subtitle ?? "Live system status"}
      badge={panel ? panel.badge : "4 Issues"}
      rows={rows}
    />
  );
}
