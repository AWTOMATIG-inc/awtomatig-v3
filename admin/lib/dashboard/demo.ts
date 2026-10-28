import { formatMoneyCompact } from "@/lib/format";

import type { DashboardData, DashboardRange } from "./types";

const DAY = 24 * 60 * 60 * 1000;

const WEEKLY_LEADS = [6, 9, 7, 11, 8, 13, 10, 12, 9, 15, 11, 14];

/**
 * SAMPLE DATA for reviewing the dashboard layout in development (`/?demo=1`). Nothing here is real, the page labels it as
 * sample data, and `getDashboard` refuses to return it outside development.
 */
export function demoDashboard(range: DashboardRange): DashboardData {
  const now = Date.now();
  const weeks = range === "7d" ? 4 : range === "30d" ? 8 : 12;
  const points = WEEKLY_LEADS.slice(-weeks).map((value, index, all) => ({
    label: `W${index + 1}`,
    value,
    highlight: index === all.length - 1,
  }));

  return {
    kpis: [
      { id: "open-leads", label: "Open leads", value: "18", context: "vs 14 in the previous 30 days", href: "/" },
      { id: "quotes", label: "Quotes awaiting reply", value: "7", context: "Oldest sent 9 days ago", href: "/" },
      { id: "overdue", label: "Overdue invoices", value: formatMoneyCompact("1240000", "BDT"), context: "5 invoices", href: "/" },
      { id: "stock", label: "Items below reorder level", value: "4", href: "/" },
    ],
    chart: { title: "Leads per week", subtitle: `Number of new leads, last ${weeks} weeks`, points },
    attention: [
      { id: "a1", title: "INV-0042 · Acme Ltd", detail: "14 days overdue", tone: "error", href: "/" },
      { id: "a2", title: "INV-0039 · Northwind", detail: "9 days overdue", tone: "error", href: "/" },
      { id: "a3", title: "Lead from the website · R. Karim", detail: "No reply for 3 days", tone: "caution", href: "/" },
      { id: "a4", title: "Quote Q-0118 · Blue Harbor", detail: "Awaiting reply for 9 days", tone: "caution", href: "/" },
      { id: "a5", title: "Item LAP-14 · Laptop charger", detail: "2 in stock, reorder level 5", tone: "neutral", href: "/" },
    ],
    activity: [
      {
        id: "e1",
        at: new Date(now - 0.2 * DAY).toISOString(),
        actor: "Nadia Rahman",
        action: "Sent quote Q-0121 to Blue Harbor",
      },
      { id: "e2", at: new Date(now - 0.6 * DAY).toISOString(), actor: "Tanvir Hasan", action: "Marked INV-0040 as paid" },
      { id: "e3", at: new Date(now - 1.1 * DAY).toISOString(), actor: "System", action: "Created lead from the website form" },
      { id: "e4", at: new Date(now - 1.8 * DAY).toISOString(), actor: "Nadia Rahman", action: "Updated client Northwind" },
      { id: "e5", at: new Date(now - 2.4 * DAY).toISOString(), actor: "Tanvir Hasan", action: "Adjusted stock for LAP-14 (-3)" },
      { id: "e6", at: new Date(now - 3.0 * DAY).toISOString(), actor: "Nadia Rahman", action: "Created invoice INV-0042" },
    ],
  };
}
