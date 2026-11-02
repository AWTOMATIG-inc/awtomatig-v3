import "server-only";

import { serverApi } from "@/lib/api/server";
import { APP_TIMEZONE } from "@/lib/config";
import { formatDayMonth, formatNumber } from "@/lib/format";

import { demoDashboard } from "./demo";
import { type DashboardData, type DashboardRange, RANGE_LABELS } from "./types";

const RANGE_DAYS: Record<DashboardRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
const DAY_MS = 24 * 60 * 60 * 1000;

type Part = { kpis: DashboardData["kpis"]; attention: DashboardData["attention"] };
type InquiryPart = Part & Pick<DashboardData, "chart" | "activity">;

const NOTHING: Part = { kpis: [], attention: [] };

const ATTENTION_LIMIT = 6;

/** Fills the worklist alternately from each module, so one busy module cannot push the others off it. */
function interleave<T>(lists: readonly (readonly T[])[], limit: number): T[] {
  const out: T[] = [];
  for (let i = 0; out.length < limit && lists.some((list) => i < list.length); i++) {
    for (const list of lists) if (i < list.length && out.length < limit) out.push(list[i]!);
  }
  return out;
}

const waitingDays = (createdAt: string) => Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS));

/**
 * The dashboard's data. Every module contributes real figures through the backend API; the CRM and Recruitment are built. A
 * module the signed-in employee cannot read, or a backend that does not answer, adds nothing, and the page shows its empty
 * states (DESIGN.md section 8.2) instead of an error. The modules load side by side and fail independently.
 *
 * `demo` swaps in clearly labelled sample data so the layout can be reviewed. It works in development only.
 */
export async function getDashboard(range: DashboardRange, options: { demo: boolean }): Promise<DashboardData> {
  if (options.demo && process.env.NODE_ENV === "development") return demoDashboard(range);

  const [inquiries, recruitment] = await Promise.all([loadInquiries(range), loadRecruitment()]);
  return {
    kpis: [...inquiries.kpis, ...recruitment.kpis],
    chart: inquiries.chart,
    attention: interleave([inquiries.attention, recruitment.attention], ATTENTION_LIMIT),
    activity: inquiries.activity,
  };
}

async function loadInquiries(range: DashboardRange): Promise<InquiryPart> {
  const days = RANGE_DAYS[range];
  const period = RANGE_LABELS[range];
  try {
    const { data } = await (
      await serverApi()
    ).GET("/api/v1/crm/leads/stats", { params: { query: { days, timeZone: APP_TIMEZONE } } });
    if (!data) return { ...NOTHING, chart: null, activity: [] };

    const unit = data.bucket === "day" ? "day" : "week";
    return {
      kpis: [
        {
          id: "needs-reply",
          group: "Inquiries",
          label: "Inquiries needing a reply",
          value: formatNumber(data.needsReply),
          context:
            data.staleCount > 0 ? `${formatNumber(data.staleCount)} waiting more than ${data.staleAfterDays} days` : undefined,
          href: "/crm/leads?status=new",
        },
        {
          id: "inquiries",
          group: "Inquiries",
          label: `Inquiries, last ${period}`,
          value: formatNumber(data.inRange),
          context: `${formatNumber(data.previousRange)} in the previous ${period}`,
          href: "/crm/leads",
        },
        { id: "open-leads", group: "Inquiries", label: "Open inquiries", value: formatNumber(data.open), href: "/crm/leads" },
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
    return { ...NOTHING, chart: null, activity: [] };
  }
}

/** Open positions, applications nobody has looked at, and the applications that have waited longest. Not range-bound: these are
 *  what is open right now. */
async function loadRecruitment(): Promise<Part> {
  try {
    const { data } = await (await serverApi()).GET("/api/v1/recruitment/stats");
    if (!data) return NOTHING;
    return {
      kpis: [
        {
          id: "new-applications",
          group: "Recruitment",
          label: "New applications",
          value: formatNumber(data.newApplications),
          context:
            data.staleCount > 0 ? `${formatNumber(data.staleCount)} waiting more than ${data.staleAfterDays} days` : undefined,
          href: "/recruitment/jobs",
        },
        {
          id: "open-positions",
          group: "Recruitment",
          label: "Open positions",
          value: formatNumber(data.openJobs),
          context:
            data.closingSoon > 0 ? `${formatNumber(data.closingSoon)} closing within ${data.closingSoonDays} days` : undefined,
          href: "/recruitment/jobs?status=open",
        },
      ],
      attention: data.stale.map((application) => ({
        id: application.id,
        title: `${application.fullName} · ${application.jobTitle}`,
        detail: `Waiting ${waitingDays(application.createdAt)} days for review`,
        tone: "caution" as const,
        href: `/recruitment/jobs/${application.jobId}/applications/${application.id}`,
      })),
    };
  } catch {
    return NOTHING;
  }
}
