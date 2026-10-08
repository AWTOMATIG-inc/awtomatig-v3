import { Eyebrow } from "@/app/components/ui";

/** Contact page hero: a light page hero (off-white, faint ribs) under the light navbar, with the title at the top-left
 *  and the intro on the right at the bottom. Frame-scaled from lg up like the dark heroes (`.hero` / `.hero-inner`). */
export default function ContactHeroSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="hero relative overflow-hidden bg-surface-subtle text-fg-strong"
    >
      {/* Faint white bars, strongest at the top and fading out towards the bottom */}
      <div aria-hidden="true" className="ribs-fade-down pointer-events-none absolute inset-0 text-white/40" />

      <div className="hero-inner site-container relative flex flex-col pb-40 lg:pb-85 lg:pt-160">
        <Eyebrow className="text-fg-strong">Start a conversation</Eyebrow>

        <div className="mt-24 flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          <h1 id="contact-title" className="type-display-100">
            Tell us what
            <br className="max-lg:hidden" /> needs to work
            <br className="max-lg:hidden" /> better.
          </h1>

          <p className="type-body-16 max-w-640 text-fg-primary lg:type-body-22 lg:w-fit lg:max-w-none lg:shrink-0">
            You don’t need to arrive with a fully defined solution.
            <br className="max-lg:hidden" /> Tell us what’s getting stuck, what needs to change or
            <br className="max-lg:hidden" /> where the business is feeling friction, and we’ll help
            <br className="max-lg:hidden" /> identify the right direction.
          </p>
        </div>
      </div>
    </section>
  );
}
