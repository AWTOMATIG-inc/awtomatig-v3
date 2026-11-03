import { Eyebrow } from "@/app/components/ui";
import type { ReactNode } from "react";
import { PROBLEMS, type Problem } from "./problems";
import ProblemCard from "./ProblemCard";

type ProblemsBlockProps = {
  /** Id of the title, for the section's `aria-labelledby` */
  titleId?: string;
  /** Top padding of the header row (Home: the block follows a hairline, campaign pages open the section with it) */
  paddingClassName?: string;
  /** Padding under the card grid (Home: lg:pb-104) */
  bottomClassName?: string;
  /** Own copy for the header row and the cards (default: the Home Operations copy) */
  eyebrow?: string;
  title?: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  problems?: Problem[];
};

/** "When things break down": header row and the four problem cards with their animated mockups. Lives inside a section's
 *  `site-container` (Home Operations, campaign pages). */
export default function ProblemsBlock({
  titleId,
  paddingClassName = "pt-60 lg:pt-116",
  bottomClassName = "pb-60 lg:pb-104",
  eyebrow = "When things break down",
  title = "Complexity grows quietly.",
  titleClassName = "max-w-[8em]",
  description = "Disconnected tools, manual processes and unclear ownership accumulate as businesses grow.",
  problems = PROBLEMS,
}: ProblemsBlockProps) {
  return (
    <>
      <div className={`grid gap-20 lg:grid-cols-[365fr_565fr_390fr] lg:gap-0 ${paddingClassName}`}>
        <Eyebrow className="self-start lg:mt-10">{eyebrow}</Eyebrow>
        <h2 id={titleId} className={`type-heading-60 ${titleClassName}`}>
          {title}
        </h2>
        <p className="type-body-16 max-w-390 self-end">{description}</p>
      </div>

      <ul className={`mt-40 grid gap-20 md:grid-cols-2 lg:mt-77 xl:grid-cols-4 ${bottomClassName}`}>
        {problems.map((problem) => (
          <li key={problem.title} className="flex">
            <ProblemCard problem={problem} />
          </li>
        ))}
      </ul>
    </>
  );
}
