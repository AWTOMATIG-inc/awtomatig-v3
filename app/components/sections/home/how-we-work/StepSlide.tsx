import { Eyebrow } from "@/app/components/ui";
import { STEP_THEMES, STEPS, type Step } from "./steps";

type StepSlideProps = { step: Step; index: number };

// One full-screen slide of the carousel: eyebrow on the left, then title, copy and the step counter; the big numeral
// sits behind the text. Everything is vertically centred in the viewport.
export default function StepSlide({ step, index }: StepSlideProps) {
  const theme = STEP_THEMES[step.theme];
  const number = String(index + 1).padStart(2, "0");
  const total = String(STEPS.length).padStart(2, "0");

  return (
    <article
      data-slide={index}
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${STEPS.length}`}
      className={`relative min-w-0 flex-1 overflow-hidden ${theme.base} ${theme.text}`}
    >
      {theme.shade && <span aria-hidden="true" className={`absolute inset-0 ${theme.shade}`} />}
      <span aria-hidden="true" className={`absolute inset-0 ${theme.ribs}`} />

      <div className="site-container relative flex h-full items-center">
        <div className="grid w-full gap-20 lg:grid-cols-[342fr_989fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">How we work</Eyebrow>

          <div className="relative">
            <span
              aria-hidden="true"
              className={`type-wordmark pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 select-none lg:right-auto lg:left-1/2 lg:-ml-90 ${theme.numeral}`}
            >
              {number}
            </span>

            <h3 className="type-display-120 relative uppercase">{step.title}</h3>
            <p className="type-body-18 relative mt-20 max-w-540 lg:mt-30">{step.description}</p>

            <div className="relative mt-20 flex items-center gap-12 lg:mt-30">
              <span className="type-body-15">
                {number} / {total}
              </span>
              <div className="flex gap-5">
                {STEPS.map((target, i) => (
                  <button
                    key={target.title}
                    type="button"
                    data-step={i}
                    aria-label={`Go to step ${i + 1}: ${target.title.replace(".", "")}`}
                    aria-current={i === index ? "step" : undefined}
                    className={`relative size-11 rounded-full border transition-colors duration-200 ease-out-expo before:absolute before:-inset-x-2 before:-inset-y-16 motion-reduce:transition-none ${
                      i === index ? "border-transparent bg-action-primary" : `${theme.dot} hover:border-action-primary`
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
