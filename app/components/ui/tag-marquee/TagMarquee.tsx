type TagMarqueeProps = {
  tags: string[];
  label: string;
  /** Wrapper layout: width, margins, borders */
  className?: string;
  /** The `<ul>`: text style and color */
  listClassName?: string;
  /** Each tag: the gap after it (padding, so the loop has no seam) and hover */
  itemClassName?: string;
  /** Full class for the animation length, e.g. `[animation-duration:40s]` */
  durationClassName?: string;
};

/**
 * Infinite slider of short tags. The track holds two identical halves and slides left by one half (animate-marquee);
 * each half repeats the list twice so it is always wider than the strip. Pauses on hover; reduced motion shows one
 * static wrapped list. Everything but the first list is hidden from assistive tech.
 */
export default function TagMarquee({
  tags,
  label,
  className = "",
  listClassName = "",
  itemClassName = "",
  durationClassName = "[animation-duration:40s]",
}: TagMarqueeProps) {
  return (
    <div className={`fade-x min-w-0 overflow-hidden motion-reduce:[mask-image:none] ${className}`}>
      <div
        aria-label={label}
        className={`animate-marquee flex w-max hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none ${durationClassName}`}
      >
        {[0, 1].map((half) => (
          <div
            key={half}
            aria-hidden={half === 1 || undefined}
            className="flex shrink-0 motion-reduce:w-full motion-reduce:[&:nth-child(2)]:hidden"
          >
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1 || undefined}
                className={`flex shrink-0 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-8 motion-reduce:[&:nth-child(2)]:hidden ${listClassName}`}
              >
                {tags.map((tag) => (
                  <li key={tag} className={`shrink-0 whitespace-nowrap ${itemClassName}`}>
                    {tag}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
