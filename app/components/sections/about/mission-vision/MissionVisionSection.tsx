import { Eyebrow } from "@/app/components/ui";
import { PILLAR_MARKS, PILLAR_THEMES, type Pillar } from "./missionVision";

const PILLARS: Pillar[] = [
  {
    id: "mission",
    eyebrow: "Mission",
    title: (
      <>
        Make complex business
        <br className="max-lg:hidden" /> operations clearer.
      </>
    ),
    description: (
      <>
        We help businesses connect the people, processes,
        <br className="max-lg:hidden" /> systems and technology behind the work.
      </>
    ),
    theme: "light",
  },
  {
    id: "vision",
    eyebrow: "Vision",
    title: (
      <>
        A future where business
        <br className="max-lg:hidden" /> systems work as one.
      </>
    ),
    description: (
      <>
        Less friction between tools. Better visibility. More
        <br className="max-lg:hidden" /> reliable ways of working.
      </>
    ),
    theme: "cyan",
  },
];

// About page: two side-by-side cards, white and cyan
export default function MissionVisionSection() {
  return (
    <section aria-label="Mission and vision" className="bg-surface-subtle">
      <div className="site-container py-40 lg:py-82">
        <ul className="grid gap-20 lg:grid-cols-2">
          {PILLARS.map((pillar) => (
            <li
              key={pillar.id}
              className={`flex flex-col rounded-12 p-24 lg:min-h-321 lg:p-40 ${PILLAR_THEMES[pillar.theme]}`}
            >
              <Eyebrow markClassName={PILLAR_MARKS[pillar.theme]}>{pillar.eyebrow}</Eyebrow>
              <h2 className="type-heading-40 mt-28 lg:mt-26">{pillar.title}</h2>
              <p className="type-body-22 mt-32 text-fg-muted lg:mt-auto lg:pt-32">{pillar.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
