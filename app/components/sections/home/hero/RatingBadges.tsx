import { useId } from "react";
import { ClutchIcon, FiverrIcon, GoogleIcon } from "@/app/components/icons";

const GOLD = "#fbbc04";
const RED = "#ff3d2e";
const STAR = "M12 2.6l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.5l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

// Five stars with the last one partly filled for a fractional rating (4.8 -> 80%)
function Stars({ rating, color }: { rating: number; color: string }) {
  const id = useId();
  return (
    <span aria-hidden className="flex">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        const gradient = `${id}-${i}`;
        return (
          <svg key={i} viewBox="2 2.5 20 19" className="h-15 w-16">
            {fill < 1 && (
              <linearGradient id={gradient}>
                <stop offset={fill} stopColor={color} />
                <stop offset={fill} stopColor={color} stopOpacity="0.25" />
              </linearGradient>
            )}
            <path d={STAR} fill={fill < 1 ? `url(#${gradient})` : color} />
          </svg>
        );
      })}
    </span>
  );
}

// Ratings shown in the design: labels sit above the score on Google / Fiverr and below it on Clutch
const BADGES = [
  { name: "Google", logo: GoogleIcon, label: "Google Rating", labelFirst: true, color: GOLD },
  { name: "Clutch", logo: ClutchIcon, label: "Based on Clutch reviews", labelFirst: false, color: RED },
  { name: "Fiverr", logo: FiverrIcon, label: "Fiverr Rating", labelFirst: true, color: GOLD },
];
const RATING = 4.8;

export default function RatingBadges() {
  return (
    <ul className="flex flex-wrap gap-8 lg:flex-nowrap lg:gap-10">
      {BADGES.map(({ name, logo: Logo, label, labelFirst, color }) => (
        <li
          key={name}
          className="bg-surface text-fg-strong rounded-8 flex h-54 min-w-150 flex-1 items-center gap-6 px-8 lg:w-164 lg:min-w-0 lg:flex-none"
        >
          <Logo className="size-28 shrink-0" />
          <div className="flex flex-col gap-2 whitespace-nowrap">
            {labelFirst && <span className="type-caption-10">{label}</span>}
            <span className="flex items-center gap-4">
              <span className="type-heading-20 font-semibold">{RATING}</span>
              <Stars rating={RATING} color={color} />
            </span>
            {!labelFirst && <span className="type-caption-10">{label}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
