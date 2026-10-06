import Image from "next/image";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { Eyebrow } from "@/app/components/ui";

// Services page intro to the four disciplines; the hero's "Explore our services" scrolls here
export default function WhatWeDoSection() {
  return (
    <section id="what-we-do" aria-labelledby="what-we-do-title" className="relative overflow-hidden bg-surface-subtle text-fg-strong">
      {/* Brand mark, cropped by the top edge; smaller below xl so it clears the paragraph */}
      <Image
        src={Decor}
        alt=""
        className="pointer-events-none absolute -top-63 -right-43 h-auto w-160 opacity-20 select-none lg:-top-95 lg:-right-64 lg:w-240 xl:-top-125 xl:-right-85 xl:w-317"
      />

      <div className="site-container relative grid gap-20 pt-60 pb-60 lg:grid-cols-[349fr_982fr] lg:gap-0 lg:pt-121 lg:pb-117">
        <Eyebrow className="self-start lg:mt-5">What we do</Eyebrow>

        <div>
          <h2 id="what-we-do-title" className="type-heading-60">
            Four disciplines built
            <br className="max-lg:hidden" /> around how businesses
            <br className="max-lg:hidden" /> actually operate.
          </h2>
          <p className="type-body-16 mt-20 max-w-640 text-fg-muted lg:type-body-22 lg:mt-32 lg:max-w-none">
            Some challenges start with a website. Others begin inside a CRM,
            <br className="max-lg:hidden" /> ERP, campaign workflow or back-office process. We work across the
            <br className="max-lg:hidden" /> full operational environment so individual improvements connect to
            <br className="max-lg:hidden" /> the bigger picture.
          </p>
        </div>
      </div>
    </section>
  );
}
