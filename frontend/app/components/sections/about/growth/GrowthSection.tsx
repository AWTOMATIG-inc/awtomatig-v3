import StepGridSection from "../../shared/step-grid/StepGridSection";
import { GROWTH_STEPS } from "./growth";

// About page: four steps as a checkerboard of photos and numbered text cards
export default function GrowthSection() {
  return (
    <StepGridSection
      id="growth"
      eyebrow="Growing with the work"
      title={
        <>
          From focused projects to
          <br className="max-lg:hidden" /> connected systems.
        </>
      }
      steps={GROWTH_STEPS}
    />
  );
}
