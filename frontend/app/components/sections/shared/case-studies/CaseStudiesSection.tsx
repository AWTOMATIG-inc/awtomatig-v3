import type { ReactNode } from "react";
import { Button, Eyebrow } from "@/app/components/ui";
import { CASE_STUDIES, type CaseStudy } from "./caseStudies";
import CaseStudyCard from "./CaseStudyCard";

type CaseStudiesSectionProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  /** Paragraph pinned to the bottom of the intro (Home); without it the intro is just the eyebrow and the title */
  description?: ReactNode;
  /** The button under the cards (default: View all case studies) */
  cta?: { label: string; href: string };
  /** Which case studies to list (default: all) */
  studies?: CaseStudy[];
  /** Section padding (default: Home's) */
  paddingClassName?: string;
};

// Desktop: the intro is sticky (top = its own offset, so it pins as the section reaches the viewport top)
// while the cards scroll past; it releases when its bottom meets the last card's bottom.
// Home "Selected work" and the campaign pages' "Proven in practice" share it; each passes its own copy.
export default function CaseStudiesSection({
  id,
  eyebrow,
  title,
  description,
  studies = CASE_STUDIES,
  paddingClassName = "pt-60 pb-60 lg:pt-120 lg:pb-115",
  cta = { label: "View all case studies", href: "/case-studies" },
}: CaseStudiesSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId} className="bg-surface-subtle text-fg-strong">
      <div className={`site-container ${paddingClassName}`}>
        <div className="grid gap-40 lg:grid-cols-[403fr_928fr] lg:gap-0">
          <div className={`flex max-w-320 flex-col lg:sticky lg:top-120 lg:self-start ${description ? "lg:min-h-525" : ""}`}>
            <Eyebrow className="lg:mt-10">{eyebrow}</Eyebrow>
            <h2 id={titleId} className="type-heading-60 mt-20">
              {title}
            </h2>
            {description && <p className="type-body-16 text-fg-primary mt-32 lg:mt-auto lg:pt-40">{description}</p>}
          </div>

          <ul className="flex flex-col gap-50 lg:gap-40">
            {studies.map((study) => (
              <li key={study.id}>
                <CaseStudyCard study={study} />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-40 lg:grid lg:grid-cols-[403fr_928fr]">
          <Button href={cta.href} size="xl" fullWidth className="lg:col-start-2 lg:max-w-551">
            {cta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
