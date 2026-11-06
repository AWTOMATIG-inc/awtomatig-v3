import { Injectable } from "@nestjs/common";

import { Database } from "../../../shared/db/database";
import { addDays, dhakaToday } from "../domain/employment-period";
import { DocumentsRepo } from "../repo/documents.repo";
import { EmployeesRepo } from "../repo/employees.repo";

/** Documents expiring within this many days are flagged on the dashboard (the same 30 days the profile uses). */
export const EXPIRING_SOON_DAYS = 30;
const LIST_LIMIT = 6;

/** The first day of the month after `today` (a Dhaka date, `YYYY-MM-DD`). */
function nextMonthStart(today: string): string {
  const [year, month] = today.split("-").map(Number) as [number, number];
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

@Injectable()
export class HrStatsService {
  constructor(
    private readonly database: Database,
    private readonly employees: EmployeesRepo,
    private readonly documents: DocumentsRepo,
  ) {}

  async stats(now: Date = new Date()) {
    const today = dhakaToday(now);
    const monthStart = `${today.slice(0, 7)}-01`;
    const headcount = await this.employees.headcount(monthStart, nextMonthStart(today));
    const expiring = await this.documents.expiringUntil(this.database.db, today, addDays(today, EXPIRING_SOON_DAYS), LIST_LIMIT);
    return {
      headcount: headcount.working,
      joinedThisMonth: headcount.joinedThisMonth,
      leftThisMonth: headcount.leftThisMonth,
      expiringSoonDays: EXPIRING_SOON_DAYS,
      expiringDocuments: expiring.total,
      expiredDocuments: expiring.expired,
      expiring: expiring.items.map((item) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeNo: item.employeeNo,
        fullName: item.fullName,
        docType: item.docType,
        title: item.title,
        expiresOn: item.expiresOn as string,
      })),
    };
  }
}
