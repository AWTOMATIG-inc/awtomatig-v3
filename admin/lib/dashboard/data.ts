import "server-only";

import { demoDashboard } from "./demo";
import type { DashboardData, DashboardRange } from "./types";

const EMPTY: DashboardData = { kpis: [], chart: null, attention: [], activity: [] };

/**
 * The dashboard's data. Every module contributes real figures through the backend API; until the first module ships
 * there is nothing to show, so this returns nothing and the page renders its empty states (DESIGN.md section 8.2).
 *
 * `demo` swaps in clearly labelled sample data so the layout can be reviewed. It works in development only.
 */
export async function getDashboard(range: DashboardRange, options: { demo: boolean }): Promise<DashboardData> {
  if (options.demo && process.env.NODE_ENV === "development") return demoDashboard(range);
  return EMPTY;
}
