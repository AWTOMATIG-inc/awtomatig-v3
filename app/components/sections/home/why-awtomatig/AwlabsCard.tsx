import { ArrowUpRightIcon, ChevronRightIcon } from "@/app/components/icons";
import { Button } from "@/app/components/ui";

const LIST = ["tools", "experiments", "what’s next"];

// Dark AWLABS teaser: charcoal card with a cyan glow and a dot grid rising from the bottom edge
export default function AwlabsCard() {
  return (
    <aside
      aria-labelledby="awlabs-title"
      className="relative isolate flex w-full flex-col sm:max-w-320 overflow-hidden rounded-16 bg-surface-inverse px-24 pt-20 pb-24 text-fg-inverse lg:mr-16 lg:h-398 lg:w-auto lg:max-w-280"
    >
      <span aria-hidden="true" className="bg-awlabs-glow absolute inset-0 -z-10" />
      <span aria-hidden="true" className="dot-grid absolute inset-x-0 bottom-0 -z-10 h-127 text-white/40" />

      <span aria-hidden="true" className="flex gap-6">
        <span className="size-5 bg-action-primary" />
        <span className="size-5 bg-action-primary" />
        <span className="size-5 bg-action-primary" />
      </span>

      <h3 id="awlabs-title" className="type-heading-28 mt-13 font-normal tracking-normal">
        AW<span className="text-action-primary">LABS</span>
      </h3>
      <span aria-hidden="true" className="mt-14 h-2 w-18 bg-white/40" />

      <p className="type-label-16 mt-25 flex gap-6 rounded-8 border border-action-primary py-9 pr-12 pl-6 font-normal text-action-primary">
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

      <Button href="#" variant="primary" size="card" iconEnd={<ArrowUpRightIcon />} fullWidth className="mt-32 lg:mt-auto">
        Explore AWLABS
      </Button>
    </aside>
  );
}
