import type { ReactNode } from "react";

type OutcomeCardProps = {
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  description: ReactNode;
  /** Padding of the card (the two designs measure differently) */
  className?: string;
  /** Text style and width of the paragraph (default Body / 15) */
  descriptionClassName?: string;
  /** The dot label above the title (default "Business outcome") */
  label?: string;
};

/** Dark "Business outcome" card: the Trusted operations card's cyan glow from the top-right corner and its diagonal
 *  streaks, a cyan dot label, a Display-gradient Heading / 40 title and a muted paragraph pinned to the bottom
 *  (campaign pages: "What changes", "Built for B2B"). */
export default function OutcomeCard({
  title,
  description,
  className = "p-24 lg:p-36",
  descriptionClassName = "type-body-15",
  label = "Business outcome",
}: OutcomeCardProps) {
  return (
    <div className={`bg-trusted-card text-fg-inverse rounded-16 relative isolate flex flex-col overflow-hidden ${className}`}>
      <span aria-hidden="true" className="diag-ribs absolute inset-0 -z-10 text-white/6" />
      <p className="type-label-14 flex items-center gap-12 uppercase">
        <span aria-hidden="true" className="bg-action-primary size-8 rounded-full" />
        {label}
      </p>

      <h3 className="type-heading-40 text-gradient-display mt-80 w-fit lg:mt-auto">{title}</h3>
      <p className={`mt-16 text-white/80 ${descriptionClassName}`}>{description}</p>
    </div>
  );
}
