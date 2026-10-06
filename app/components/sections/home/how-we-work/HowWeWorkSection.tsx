import HorizontalScroller from "./HorizontalScroller";
import StepSlide from "./StepSlide";
import { STEPS } from "./steps";

// Home "How we work": four full-screen steps that slide sideways as the page scrolls down
export default function HowWeWorkSection() {
  return (
    <HorizontalScroller id="how-we-work" count={STEPS.length} label="How we work" heading="How we work">
      {STEPS.map((step, i) => (
        <StepSlide key={step.title} step={step} index={i} />
      ))}
    </HorizontalScroller>
  );
}
