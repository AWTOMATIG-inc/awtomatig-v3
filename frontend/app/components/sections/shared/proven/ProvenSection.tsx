import Image from "next/image";
import type { ReactNode } from "react";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { CountUp, Eyebrow } from "@/app/components/ui";
import MarqueeTrack from "../partners/MarqueeTrack";
import { PARTNERS, PROVEN_STATS } from "./proven";

// Only stats with a real figure are shown
const STATS = PROVEN_STATS.filter((stat) => stat.value);

type ProvenSectionProps = {
  id?: string;
  eyebrow?: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title?: ReactNode;
  /** The brand mark cropped by the top-right corner (campaign pages) */
  decor?: boolean;
  /** Desktop top padding of the content (the campaign design starts 15px lower) */
  topPadding?: string;
};

// Proof block: four stat cards and a row of client logos (Contact "Why AWTOMATIG", campaign pages "Trust / Proof")
export default function ProvenSection({
  id = "proven",
  eyebrow = "Why AWTOMATIG",
  title = (
    <>
      Proven across the
      <br className="max-lg:hidden" /> systems that keep
      <br className="max-lg:hidden" /> businesses moving.
    </>
  ),
  decor = false,
  topPadding = "lg:pt-101",
}: ProvenSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`bg-surface-subtle text-fg-strong ${decor ? "relative overflow-hidden" : ""}`}
    >
      {decor && (
        <Image
          src={Decor}
          alt=""
          className="pointer-events-none absolute -top-105 -right-43 h-auto w-160 opacity-20 select-none lg:-top-157 lg:-right-64 lg:w-240 xl:-top-207 xl:-right-85 xl:w-317"
        />
      )}

      <div className={`site-container relative py-60 ${topPadding} lg:pb-116`}>
        <div className="grid gap-20 lg:grid-cols-[360fr_971fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-5">{eyebrow}</Eyebrow>
          <h2 id={titleId} className="type-heading-60">
            {title}
          </h2>
        </div>

        {STATS.length > 0 && (
          <ul className="mt-40 grid gap-12 sm:grid-cols-2 lg:mt-70 lg:grid-cols-4 lg:gap-20">
            {STATS.map((stat) => (
              <li key={stat.label} className="rounded-16 bg-surface flex flex-col p-24 lg:min-h-235 lg:pt-28 lg:pb-25">
                <h3 className="type-label-14 uppercase">{stat.label}</h3>
                <div className="mt-40 lg:mt-auto">
                  <p className="type-heading-50 font-normal">
                    <CountUp value={stat.value!} />
                  </p>
                  <p className="type-body-14 text-fg-primary mt-12 max-w-240">{stat.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <MarqueeTrack partners={PARTNERS} />
      </div>
    </section>
  );
}
