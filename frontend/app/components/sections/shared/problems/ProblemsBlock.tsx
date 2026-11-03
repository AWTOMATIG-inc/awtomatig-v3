import { Eyebrow } from "@/app/components/ui";
import { PROBLEMS } from "./problems";
import ProblemCard from "./ProblemCard";

type ProblemsBlockProps = {
  /** Id of the title, for the section's `aria-labelledby` */
  titleId?: string;
  /** Top padding of the header row (Home: the block follows a hairline, campaign pages open the section with it) */
  paddingClassName?: string;
};

/** "When things break down": header row and the four problem cards with their animated mockups. Lives inside a section's
 *  `site-container` (Home Operations, campaign pages). */
export default function ProblemsBlock({ titleId, paddingClassName = "pt-60 lg:pt-116" }: ProblemsBlockProps) {
  return (
    <>
      <div className={`grid gap-20 lg:grid-cols-[365fr_565fr_390fr] lg:gap-0 ${paddingClassName}`}>
        <Eyebrow className="self-start lg:mt-10">When things break down</Eyebrow>
        <h2 id={titleId} className="type-heading-60 max-w-[8em]">
          Complexity grows quietly.
        </h2>
        <p className="type-body-16 max-w-390 self-end">
          Disconnected tools, manual processes and unclear ownership accumulate as businesses grow.
        </p>
      </div>

      <ul className="mt-40 grid gap-20 pb-60 md:grid-cols-2 lg:mt-77 lg:pb-104 xl:grid-cols-4">
        {PROBLEMS.map((problem) => (
          <li key={problem.title} className="flex">
            <ProblemCard problem={problem} />
          </li>
        ))}
      </ul>
    </>
  );
}
