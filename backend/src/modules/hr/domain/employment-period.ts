/** The company works on Dhaka time: "today", a joining date and a leaving date are calendar days there. */
export const DHAKA_TIME_ZONE = "Asia/Dhaka";

/** Today's calendar date in Dhaka as `YYYY-MM-DD`. Takes the clock as an argument so tests can fix it. */
export function dhakaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** A length of time as whole years, months and days, plus the exact day count. */
export interface Period {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

const DAY_MS = 86_400_000;

function parse(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toUtc(iso: string): number {
  const { year, month, day } = parse(iso);
  return Date.UTC(year, month - 1, day);
}

/** `iso` plus `days` calendar days (negative to go back), as `YYYY-MM-DD`. */
export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (`to` not counted). Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** `from` plus whole months. A day that does not exist in the target month (31 Jan + 1 month) becomes that month's last day. */
function addMonths(from: string, months: number): string {
  const { year, month, day } = parse(from);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

/**
 * The time from `from` up to `to` (`to` not counted, so 1 Nov to 1 Feb is exactly 3 months). Whole months are counted first, and a
 * month that starts on the 29th to 31st is complete on the last day of a shorter month (31 Jan to 28 Feb is 1 month), then the days
 * left over. An end before the start gives zeros, which is what an employee who has not started yet should show.
 */
export function calculatePeriod(from: string, to: string): Period {
  const totalDays = daysBetween(from, to);
  if (totalDays <= 0) return { years: 0, months: 0, days: 0, totalDays: 0 };

  const start = parse(from);
  const end = parse(to);
  let months = (end.year - start.year) * 12 + (end.month - start.month);
  if (addMonths(from, months) > to) months -= 1;
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: daysBetween(addMonths(from, months), to),
    totalDays,
  };
}

/**
 * Where counting stops for someone who is still working or has left: today, or the day after the leaving date once that has passed
 * (the leaving date itself is a day worked, so 1 Aug to 30 Sep is exactly 2 months).
 */
export function countingEnd(leftOn: string | null, today: string): string {
  return leftOn !== null && leftOn <= today ? addDays(leftOn, 1) : today;
}
