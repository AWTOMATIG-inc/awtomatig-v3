"use client";
import Image, { type StaticImageData } from "next/image";

export type MarqueePartner = { name: string; logo: StaticImageData; height: string; tone: string };

type MarqueeTrackProps = {
  partners: MarqueePartner[];
  /** Hairline colour beside the heading */
  ruleClassName?: string;
  /** Top margins of the heading row and of the slider (Contact is the default) */
  rowClassName?: string;
  trackClassName?: string;
};

// "Trusted by" heading row (with a pause/play toggle) and the infinite logo slider: a client child so the
// toggle can stop the CSS animation (WCAG 2.2.2), while ProvenSection itself stays a Server Component.
export default function MarqueeTrack({
  partners,
  ruleClassName = "bg-border",
  rowClassName = "mt-50 lg:mt-58",
  trackClassName = "mt-32 lg:mt-26",
}: MarqueeTrackProps) {
  return (
    <>
      <div className={`flex items-center gap-20 lg:gap-32 ${rowClassName}`}>
        <span aria-hidden="true" className={`h-px flex-1 ${ruleClassName}`} />
        <h3 className="type-heading-24 text-center tracking-tight">Trusted By Leading Companies</h3>
        <span aria-hidden="true" className={`h-px flex-1 ${ruleClassName}`} />
      </div>

      {/* Two identical groups, the track slides left by one group (-50%) and loops; the copy is hidden from assistive tech */}
      <div className={`fade-x overflow-hidden motion-reduce:[mask-image:none] ${trackClassName}`}>
        <div
          aria-label="Logo slider"
          className="animate-marquee flex w-max focus-within:[animation-play-state:paused] hover:[animation-play-state:paused] data-paused:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:[animation-play-state:paused]"
        >
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="flex shrink-0 items-center py-10 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-20 lg:min-h-80 motion-reduce:[&:nth-child(2)]:hidden"
            >
              {partners.map((partner) => (
                <li key={partner.name} className="px-24 lg:px-40">
                  <Image
                    src={partner.logo}
                    alt={copy === 0 ? partner.name : ""}
                    className={`ease-out-quint h-40 w-auto object-contain transition-[filter,opacity] duration-450 motion-reduce:transition-none ${partner.height} ${partner.tone}`}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </>
  );
}
