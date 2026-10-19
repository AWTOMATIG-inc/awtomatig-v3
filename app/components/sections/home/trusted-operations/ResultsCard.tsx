import CountUp from "./CountUp";
import { RESULTS } from "./trustedOperations";

// White card: three headline results split by hairlines, each with an icon tile
export default function ResultsCard() {
  return (
    <ul className="rounded-16 bg-surface text-fg-strong flex flex-col px-24 lg:px-28 lg:pt-5 lg:pb-2">
      {RESULTS.map(({ value, label, icon: Icon }) => (
        <li
          key={label}
          className="border-surface-subtle grid grid-cols-[40px_1fr] gap-x-20 border-b pt-24 pb-30 last:border-b-0 lg:flex-1 lg:gap-x-57"
        >
          <span className="bg-surface-subtle rounded-8 mt-8 flex size-40 items-center justify-center">
            <Icon className="size-20" />
          </span>
          <div>
            <p className="type-heading-50 font-normal">
              <CountUp value={value} />
            </p>
            <p className="type-body-16 text-fg-primary">{label}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
