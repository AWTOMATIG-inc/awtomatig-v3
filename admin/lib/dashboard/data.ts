import "server-only";

import { serverApi } from "@/lib/api/server";
import { APP_TIMEZONE } from "@/lib/config";
import { formatDayMonth, formatNumber } from "@/lib/format";

import { demoDashboard } from "./demo";
import { type DashboardData, type DashboardRange, RANGE_LABELS } from "./types";

const EMPTY: DashboardData = { kpis: [], chart: null, attention: [], activity: [] };

const RANGE_DAYS: Record<DashboardRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The dashboard's data. Every module contributes real figures through the backend API; the CRM is the first. A module the
 * signed-in employee cannot read, or a backend that does not answer, adds nothing, and the page shows its empty states
 * (DESIGN.md section 8.2) instead of an error.
 *
 * `demo` swaps in clearly labelled sample data so the layout can be reviewed. It works in development only.
 */
export async function getDashboard(range: DashboardRange, options: { demo: boolean }): Promise<DashboardData> {
  if (options.demo && process.env.NODE_ENV === "development") return demoDashboard(range);

  const days = RANGE_DAYS[range];
  const period = RANGE_LABELS[range];
  try {
    const { data } = await (
      await serverApi()
    ).GET("/api/v1/crm/leads/stats", { params: { query: { days, timeZone: APP_TIMEZONE } } });
    if (!data) return EMPTY;

    const now = Date.now();
    const waitingDays = (createdAt: string) => Math.max(1, Math.floor((now - new Date(createdAt).getTime()) / DAY_MS));
    const unit = data.bucket === "day" ? "day" : "week";

    return {
      kpis: [
        {
          id: "needs-reply",
          label: "Inquiries needing a reply",
          value: formatNumber(data.needsReply),
          context:
            data.staleCount > 0 ? `${formatNumber(data.staleCount)} waiting more than ${data.staleAfterDays} days` : undefined,
          href: "/crm/leads?status=new",
        },
        {
          id: "inquiries",
          label: `Inquiries, last ${period}`,
          value: formatNumber(data.inRange),
          context: `${formatNumber(data.previousRange)} in the previous ${period}`,
          href: "/crm/leads",
        },
        { id: "open-leads", label: "Open inquiries", value: formatNumber(data.open), href: "/crm/leads" },
      ],
      chart: {
        title: `Inquiries per ${unit}`,
        subtitle: `Number of new inquiries, last ${period}`,
        points: data.series.map((point, index, all) => ({
          label: formatDayMonth(point.start),
          value: point.count,
          highlight: index === all.length - 1,
        })),
      },
      attention: data.stale.map((lead) => ({
        id: lead.id,
        title: lead.company ? `${lead.name} · ${lead.company}` : lead.name,
        detail: `Waiting ${waitingDays(lead.createdAt)} days for a first reply`,
        tone: "caution" as const,
        href: `/crm/leads/${lead.id}`,
      })),
      activity: data.activity,
    };
  } catch {
    return EMPTY;
  }
}
