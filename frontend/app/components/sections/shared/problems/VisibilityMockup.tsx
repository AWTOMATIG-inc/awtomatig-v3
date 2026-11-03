import { BarChartIcon, DatabaseIcon, PersonIcon } from "@/app/components/icons";
import StatusListMockup, { type StatusRow } from "./StatusListMockup";

const ROWS: StatusRow[] = [
  { label: "Task ownership", status: "Unknown", tone: "warning", icon: PersonIcon },
  { label: "Approval queue", status: "Delayed", tone: "warning", icon: DatabaseIcon },
  { label: "Reporting status", status: "Incomplete", tone: "warning", icon: BarChartIcon },
  { label: "System sync", status: "Needs review", tone: "caution", icon: DatabaseIcon },
];

export default function VisibilityMockup() {
  return <StatusListMockup title="Operations" subtitle="Live system status" badge="4 Issues" rows={ROWS} />;
}
