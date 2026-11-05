import { BarChart3, Briefcase, CircleHelp, Gauge, Images, Inbox, LayoutDashboard, type LucideIcon, Quote } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: readonly NavItem[];
}

/**
 * The sidebar. One entry per real screen: a module appears here when its screens exist (and, later, when the user holds a
 * permission for it). Do not list modules that are not built.
 */
export const NAV: readonly NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }] },
  { label: "CRM", items: [{ label: "Contact Inquiries", href: "/crm/leads", icon: Inbox }] },
  { label: "Recruitment", items: [{ label: "Job Openings", href: "/recruitment/jobs", icon: Briefcase }] },
  {
    label: "Website",
    items: [
      { label: "Case Studies", href: "/cms/case-studies", icon: Images },
      { label: "Testimonials", href: "/cms/testimonials", icon: Quote },
      { label: "FAQs", href: "/cms/faqs", icon: CircleHelp },
      { label: "Site Metrics", href: "/cms/site-metrics", icon: Gauge },
    ],
  },
  { label: "Analytics", items: [{ label: "Google Analytics", href: "/analytics/google", icon: BarChart3 }] },
];

/** Finds the nav item for a path: the longest matching href wins, so `/crm/leads` matches `/crm/leads` before `/crm`. */
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV.flatMap((group) => group.items)
    .filter((item) => (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
