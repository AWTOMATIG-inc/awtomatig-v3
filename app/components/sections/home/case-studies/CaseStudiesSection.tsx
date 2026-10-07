import { Button, Eyebrow } from "@/app/components/ui";
import { CASE_STUDIES } from "../../shared/case-studies/caseStudies";
import CaseStudyCard from "./CaseStudyCard";

// Desktop: the intro is sticky (top = its own offset, so it pins as the section reaches the viewport top)
// while the cards scroll past; it releases when its bottom meets the last card's bottom.
export default function CaseStudiesSection() {
  return (
    <section id="case-studies" aria-labelledby="case-studies-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-120 lg:pb-115">
        <div className="grid gap-40 lg:grid-cols-[403fr_928fr] lg:gap-0">
          <div className="flex max-w-320 flex-col lg:sticky lg:top-120 lg:min-h-525 lg:self-start">
            <Eyebrow className="lg:mt-10">Selected work</Eyebrow>
            <h2 id="case-studies-title" className="type-heading-60 mt-20">
              Systems are only useful when they improve outcomes.
            </h2>
            <p className="type-body-16 mt-32 text-fg-primary lg:mt-auto lg:pt-40">
              AWTOMATIG works across infrastructure, operations, business systems and AdTech to turn fragmented
              processes into clearer, more scalable ways of working.
            </p>
          </div>

          <ul className="flex flex-col gap-50 lg:gap-40">
            {CASE_STUDIES.map((study) => (
              <li key={study.id}>
                <CaseStudyCard study={study} />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-40 lg:grid lg:grid-cols-[403fr_928fr]">
          <Button href="/case-studies" size="xl" fullWidth className="lg:col-start-2 lg:max-w-551">
            View all case studies
          </Button>
        </div>
      </div>
    </section>
  );
}
