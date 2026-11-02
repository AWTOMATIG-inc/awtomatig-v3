import { APP_TIMEZONE } from "./config";

const LOCALE = "en-GB";

/** `12 Oct 2026` */
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIMEZONE }).format(
    new Date(value),
  );
}

/** `12 Oct`, from a plain `YYYY-MM-DD` date (no time zone conversion: the backend already cut it in the app's time zone). */
export function formatDayMonth(localDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${localDate}T00:00:00Z`),
  );
}

/** `12 Oct 2026, 14:05` (24-hour) */
export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: APP_TIMEZONE,
  }).format(new Date(value));
}

/** Money with its currency and two decimals. `amount` is the string the API returns (numeric(19,4)), never a float. */
export function formatMoney(amount: string, currency: string): string {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency, currencyDisplay: "code" }).format(Number(amount));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

/** `20 Nov 2025`, from a plain `YYYY-MM-DD` date (a deadline, a completion date): no time zone conversion, it is a calendar day. */
export function formatPlainDate(localDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${localDate}T00:00:00Z`),
  );
}

/** `80,000.50`: an amount from the API (a decimal string) without the currency, for the second half of a range. Two decimals, like `formatMoney`. */
export function formatAmount(amount: string): string {
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount));
}

/** `84 KB` or `1.2 MB` */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${formatNumber(bytes)} B`;
  if (bytes < 1024 * 1024) return `${formatNumber(Math.round(bytes / 1024))} KB`;
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

/** A short money figure for a KPI card: `BDT 1.24M`. The exact amount is on the list the card links to. */
export function formatMoneyCompact(amount: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}
