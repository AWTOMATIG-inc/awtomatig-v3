import { BarChartIcon, CloudIcon, StorefrontIcon, TableIcon } from "@/app/components/icons";
import StatusListMockup, { type StatusRow } from "./StatusListMockup";

const ROWS: StatusRow[] = [
  { label: "Content Update", status: "Unassigned", tone: "warning", icon: TableIcon },
  { label: "CRM sync", status: "Shared", tone: "warning", icon: CloudIcon },
  { label: "Reporting review", status: "Waiting", tone: "warning", icon: BarChartIcon },
  { label: "Website Issue", status: "No owner", tone: "caution", icon: StorefrontIcon },
];

export default function OwnershipMockup() {
  return <StatusListMockup title="Task ownership" subtitle="People, teams and ownership" rows={ROWS} />;
}
