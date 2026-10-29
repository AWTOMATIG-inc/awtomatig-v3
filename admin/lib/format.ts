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
