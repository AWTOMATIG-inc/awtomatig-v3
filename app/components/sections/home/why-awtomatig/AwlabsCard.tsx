import { ArrowUpRightIcon, ChevronRightIcon } from "@/app/components/icons";
import { Button } from "@/app/components/ui";
import { SITE } from "@/lib/site";

const LIST = ["tools", "experiments", "what’s next"];

// Dark AWLABS teaser: charcoal card with a cyan glow and a dot grid rising from the bottom edge
export default function AwlabsCard() {
  return (
    <aside
      aria-labelledby="awlabs-title"
      className="rounded-16 bg-surface-inverse text-fg-inverse relative isolate flex w-full flex-col overflow-hidden px-24 pt-20 pb-24 sm:max-w-320 lg:mr-16 lg:h-398 lg:w-auto lg:max-w-280"
    >
      <span aria-hidden="true" className="bg-awlabs-glow absolute inset-0 -z-10" />
      <span aria-hidden="true" className="dot-grid absolute inset-x-0 bottom-0 -z-10 h-127 text-white/40" />

      <span aria-hidden="true" className="flex gap-6">
        <span className="bg-action-primary size-5" />
        <span className="bg-action-primary size-5" />
        <span className="bg-action-primary size-5" />
      </span>

      <h3 id="awlabs-title" className="type-heading-28 mt-13 font-normal tracking-normal">
        AW<span className="text-action-primary">LABS</span>
      </h3>
      <span aria-hidden="true" className="mt-14 h-2 w-18 bg-white/40" />

      <p className="type-label-16 rounded-8 border-action-primary text-action-primary mt-25 flex gap-6 border py-9 pr-12 pl-6 font-normal">
        <ChevronRightIcon aria-hidden="true" className="size-20 shrink-0" />
        <span>
          Imagine
          <br />
          Something better _
        </span>
      </p>

      <ul className="type-body-16-compact mt-26 pl-6 text-white/40">
        {LIST.map((item) => (
          <li key={item} className="flex gap-8">
            <span aria-hidden="true">/</span>
            {item}
          </li>
        ))}
      </ul>

      {/* A disabled placeholder keeps the card's layout until AWLABS has a URL */}
      {SITE.social.awlabs ? (
        <Button
          href={SITE.social.awlabs}
          variant="primary"
          size="card"
          iconEnd={<ArrowUpRightIcon />}
          fullWidth
          className="mt-32 lg:mt-auto"
        >
          Explore AWLABS
        </Button>
      ) : (
        <Button disabled variant="primary" size="card" fullWidth className="mt-32 lg:mt-auto">
          AWLABS coming soon
        </Button>
      )}
    </aside>
  );
}
