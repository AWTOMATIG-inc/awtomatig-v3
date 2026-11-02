import { Eyebrow, LinesBackground } from "@/app/components/ui";
import { CONTACT_LINES } from "../../contact/hero/contactLines";

/** Careers page hero: the Contact page's light hero (off-white, faint animated ribs) under the light navbar, with the title at
 *  the top-left and the intro on the right at the bottom. Frame-scaled from lg up like the other heroes (`.hero` / `.hero-inner`). */
export default function CareersHeroSection() {
  return (
    <LinesBackground
      preset={CONTACT_LINES}
      id="careers"
      aria-labelledby="careers-title"
      data-hero
      className="hero text-fg-strong"
    >
      <div className="hero-inner site-container relative z-20 flex flex-col pb-40 lg:pt-160 lg:pb-85">
        <Eyebrow className="text-fg-strong">Careers</Eyebrow>

        <div className="mt-24 flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          <h1 id="careers-title" className="type-display-100">
            Build better
            <br className="max-lg:hidden" /> systems with us.
          </h1>

          <p className="type-body-16 text-fg-primary lg:type-body-22 max-w-640 lg:w-fit lg:max-w-none lg:shrink-0">
            AWTOMATIG builds websites, ERP systems and automation
            <br className="max-lg:hidden" /> for growing businesses. See what is open and apply
            <br className="max-lg:hidden" /> online with your details and resume.
          </p>
        </div>
      </div>
    </LinesBackground>
  );
}
