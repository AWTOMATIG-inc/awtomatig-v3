/** Today's date in Dhaka (`YYYY-MM-DD`): the company's clock, the one the backend judges joining and leaving dates by. */
export function todayInDhaka(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    now,
  );
}

export interface Period {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

const DAY_MS = 86_400_000;

function parts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

const utc = (iso: string) => {
  const { year, month, day } = parts(iso);
  return Date.UTC(year, month - 1, day);
};

function addMonths(iso: string, months: number): string {
  const { year, month, day } = parts(iso);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  const last = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const text = (value: number, width: number) => String(value).padStart(width, "0");
  return `${text(targetYear, 4)}-${text(targetMonth, 2)}-${text(Math.min(day, last), 2)}`;
}

/**
 * Time from `from` up to `to` (`to` not counted) in whole years, months and days. This is only a live preview under the joining
 * date field: it follows the backend's rule (a month that starts on the 29th to 31st completes on the last day of a shorter
 * month), and the backend's figure is the one shown everywhere else.
 */
export function calculatePeriod(from: string, to: string): Period {
  const totalDays = Math.round((utc(to) - utc(from)) / DAY_MS);
  if (totalDays <= 0) return { years: 0, months: 0, days: 0, totalDays: 0 };
  const start = parts(from);
  const end = parts(to);
  let months = (end.year - start.year) * 12 + (end.month - start.month);
  if (addMonths(from, months) > to) months -= 1;
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: Math.round((utc(to) - utc(addMonths(from, months))) / DAY_MS),
    totalDays,
  };
}
