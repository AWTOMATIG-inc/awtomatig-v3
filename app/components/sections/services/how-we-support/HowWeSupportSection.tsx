import Image from "next/image";
import { Eyebrow } from "@/app/components/ui";
import { SUPPORT_MODES, SUPPORT_THEMES } from "./howWeSupport";

// Services page: Build / Operate / Improve, three square cards with a product mockup above the copy
export default function HowWeSupportSection() {
  return (
    <section id="how-we-support" aria-labelledby="how-we-support-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-48 lg:pb-115">
        <div className="grid gap-20 lg:grid-cols-[373fr_576fr_382fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-10">How we support</Eyebrow>
          <h2 id="how-we-support-title" className="type-heading-60">
            Build it. Operate it.
            <br className="max-lg:hidden" /> Improve it.
          </h2>
          <p className="type-body-16 max-w-400 lg:translate-y-4 lg:self-end">
            Some clients need a defined project. Others need ongoing operational capability. Our services can
            support both.
          </p>
        </div>

        <ul className="mt-40 grid gap-20 lg:mt-77 lg:grid-cols-3">
          {SUPPORT_MODES.map((mode) => (
            <li key={mode.title} className={`flex flex-col overflow-hidden rounded-12 p-24 lg:h-425 ${SUPPORT_THEMES[mode.theme]}`}>
              <div className="flex min-h-0 flex-1 items-center justify-center pb-24">
                <Image
                  src={mode.image}
                  alt=""
                  sizes="(min-width: 1024px) 391px, 90vw"
                  className={`h-auto max-w-full ${mode.imageOffset}`}
                />
              </div>
              <h3 className="type-heading-28">{mode.title}</h3>
              <p className="type-body-16-compact mt-12 max-w-355">{mode.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
