import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

/**
 * A column title that sorts the list: the first click sorts by it, the next one flips the direction. It is a link, so sorting
 * happens on the server (root rules); the caller works out where the click leads.
 */
export function SortHeader({
  label,
  href,
  active,
  order,
}: {
  label: string;
  /** Where a click leads: this column sorted, or the opposite direction when it already is. */
  href: string;
  active: boolean;
  /** The list's current direction; the arrow shows only on the active column. */
  order: "asc" | "desc";
}) {
  const Icon = order === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={href}
      aria-label={`Sort by ${label}`}
      className="ease-out-quint hover:text-fg-strong inline-flex items-center gap-4 uppercase transition-colors duration-200 motion-reduce:transition-none"
    >
      {label}
      {active && <Icon strokeWidth={1.5} aria-hidden="true" className="size-14" />}
    </Link>
  );
}
