import Image from "next/image";
import type { ReactNode } from "react";
import Decor from "@/public/images/awtomatig-mark-decor.png";
import { CountUp, Eyebrow } from "@/app/components/ui";
import BackgroundVideo from "./BackgroundVideo";
import MarqueeTrack from "../partners/MarqueeTrack";
import { getSiteMetrics } from "@/lib/siteMetrics";
import { PARTNERS, PROVEN_STATS, type ProvenStat } from "./proven";

type ProvenSectionProps = {
  id?: string;
  eyebrow?: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title?: ReactNode;
  /** The brand mark cropped by the top-right corner (campaign pages) */
  decor?: boolean;
  /** Desktop top padding of the content (the campaign design starts 15px lower) */
  topPadding?: string;
  /** Desktop bottom padding of the content (default lg:pb-116) */
  bottomPadding?: string;
  /** The four stat cards (default: the shared ones); each takes its figure from the admin's Site Metrics */
  stats?: ProvenStat[];
  /** Heading above the logo slider */
  logoCaption?: string;
  /** A video behind the whole section (campaign pages): the section turns dark with white text and the logos go light */
  videoSrc?: string;
};

// Over a video every logo is a light silhouette (the grey tones are made for off-white)
const LIGHT_LOGO = "brightness-0 invert opacity-70 hover:opacity-100";

// Proof block: four stat cards and a row of client logos (Contact "Why AWTOMATIG", campaign pages "Trust / Proof")
export default async function ProvenSection({
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
  bottomPadding = "lg:pb-116",
  stats = PROVEN_STATS,
  logoCaption,
  videoSrc,
}: ProvenSectionProps) {
  const titleId = `${id}-title`;
  const metrics = await getSiteMetrics();
  const shown = stats.map((stat) => ({ ...stat, value: metrics[stat.metric] })).filter((stat) => stat.value);
  const partners = videoSrc ? PARTNERS.map((partner) => ({ ...partner, tone: LIGHT_LOGO })) : PARTNERS;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`${videoSrc ? "bg-surface-inverse text-fg-inverse" : "bg-surface-subtle text-fg-strong"} ${decor || videoSrc ? "relative overflow-hidden" : ""}`}
    >
      {videoSrc && (
        <>
          <BackgroundVideo src={videoSrc} />
          {/* Keeps the white text readable over any frame of the video */}
          <span aria-hidden="true" className="absolute inset-0 bg-black/60" />
        </>
      )}

      {decor && (
        <Image
          src={Decor}
          alt=""
          className="pointer-events-none absolute -top-105 -right-43 h-auto w-160 opacity-20 select-none lg:-top-157 lg:-right-64 lg:w-240 xl:-top-207 xl:-right-85 xl:w-317"
        />
      )}

      <div className={`site-container relative py-60 ${topPadding} ${bottomPadding}`}>
        <div className="grid gap-20 lg:grid-cols-[360fr_971fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-5">{eyebrow}</Eyebrow>
          <h2 id={titleId} className="type-heading-60">
            {title}
          </h2>
        </div>

        {shown.length > 0 && (
          <ul className="mt-40 grid gap-12 sm:grid-cols-2 lg:mt-70 lg:grid-cols-4 lg:gap-20">
            {shown.map((stat) => (
              <li
                key={stat.label}
                className="rounded-16 bg-surface text-fg-strong flex flex-col p-24 lg:min-h-235 lg:pt-28 lg:pb-25"
              >
                <h3 className="type-label-14 uppercase">{stat.label}</h3>
                <div className="mt-40 lg:mt-auto">
                  <p className="type-heading-50 font-normal">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="type-body-14 text-fg-primary mt-12 max-w-240">{stat.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <MarqueeTrack partners={partners} heading={logoCaption} ruleClassName={videoSrc ? "bg-white/20" : undefined} />
      </div>
    </section>
  );
}
