import { CloudIcon } from "@/app/components/icons";
import { delay, ENTER, Kebab, ListRow, RowList, Status } from "./parts";

// The illustrations show an example, not claims about the visitor's business. Every one is drawn in a 420×253 frame
// (spacing units follow mockup-scale, so it shrinks with the card).

export function OutdatedMockup() {
  const rows = [
    { tone: "warning", label: "Outdated" },
    { tone: "live", label: "Update Available" },
    { tone: "warning", label: "Deprecated" },
  ] as const;
  return (
    <RowList>
      {rows.map((row, i) => (
        <ListRow
          key={row.label}
          index={i}
          title="CMS Core"
          caption="v5.8.1 (2 years old)"
          right={
            <>
              <Status {...row} />
              <Kebab />
            </>
          }
        />
      ))}
    </RowList>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
// The trend line in the panel's 342×56 plot
const LINE = "M0 4L39 25L65 13L111 33L162 18L191 36L232 33L265 14L296 27L342 45";

export function PerformanceMockup() {
  return (
    <div className="absolute inset-x-31 top-24">
      <div style={delay(150)} className={`${ENTER} rounded-8 bg-surface h-60 px-12 pt-12`}>
        <p className="type-body-14 text-fg-strong flex justify-between">
          Page load time <span>5.8s</span>
        </p>
        <div className="bg-surface-subtle mt-11 h-10 overflow-hidden rounded-full">
          <div className="bg-action-primary ease-out-quint h-full w-[51%] origin-left motion-safe:scale-x-0 motion-safe:transition-transform motion-safe:delay-300 motion-safe:duration-1500 motion-safe:group-data-shown:scale-x-100" />
        </div>
      </div>

      <div style={delay(300)} className={`${ENTER} rounded-8 bg-surface mt-7 h-143 px-12 pt-12`}>
        <p className="type-body-14 text-fg-strong flex justify-between">
          Performance overtime <span>Slower</span>
        </p>
        <svg viewBox="0 0 342 56" className="mt-16 h-56 w-full overflow-visible" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="var(--color-warning)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--color-warning)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${LINE}V64H0Z`} fill="url(#perf-fill)" />
          <path d={LINE} stroke="var(--color-warning)" strokeOpacity="0.55" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <p className="type-caption-12 mt-18 flex justify-between text-black/60">
          {MONTHS.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </p>
      </div>
    </div>
  );
}

export function PublishingMockup() {
  const rows = [
    { title: "Homepage requested", caption: "Requested 2 days ago", tone: "warning", label: "Outdated" },
    { title: "Campaign Page", caption: "Requested 4 days ago", tone: "live", label: "In review" },
    { title: "Blog post", caption: "Requested 5 days ago", tone: "warning", label: "Blocked" },
  ] as const;
  return (
    <RowList>
      {rows.map(({ title, caption, tone, label }, i) => (
        <ListRow
          key={title}
          index={i}
          title={title}
          caption={caption}
          right={
            <>
              <Status tone={tone} label={label} />
              <Kebab />
            </>
          }
        />
      ))}
    </RowList>
  );
}

// Tools as white chips joined by dashed links with orange break points
const CHIPS = [
  { label: "Forms", className: "top-58 left-41 w-102" },
  { label: "CRM", className: "top-35 left-269 w-93" },
  { label: "Analytics", className: "top-176 left-52 w-126" },
  { label: "Internal tools", className: "top-155 left-223 w-156" },
];
const LINKS = ["M78 95V176", "M143 76H198V114", "M198 114H315V71", "M198 114H145V176", "M315 114V155"];
const BREAKS = [
  [78, 135],
  [198, 114],
  [315, 114],
];

export function SystemsMockup() {
  return (
    <>
      <svg viewBox="0 0 420 253" className="absolute inset-0 size-full" fill="none" aria-hidden="true">
        {LINKS.map((d) => (
          <path key={d} d={d} stroke="black" strokeOpacity="0.2" strokeDasharray="3 3" />
        ))}
        {BREAKS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="var(--color-warning)" />
        ))}
      </svg>
      {CHIPS.map(({ label, className }, i) => (
        <span
          key={label}
          style={delay(100 + i * 120)}
          className={`${ENTER} type-body-14 rounded-8 bg-surface text-fg-strong absolute flex h-36 items-center justify-center gap-7 ${className}`}
        >
          <CloudIcon className="size-16" />
          {label}
        </span>
      ))}
    </>
  );
}

const STEPS = [
  { title: "Build", caption: "Completed in 2m 14s", state: "done" },
  { title: "Tests", caption: "Passed (12/12)", state: "done" },
  { title: "Deploy to production", caption: "Manual step required", state: "active", pill: "Manual" },
  { title: "Post deploy checks", caption: "Not run", state: "todo", pill: "Pending" },
] as const;

const STEP_DOT = {
  done: "bg-surface-subtle",
  active: "bg-action-primary",
  todo: "border border-black/10",
};

export function DeploymentMockup() {
  return (
    <ol style={delay(150)} className={`${ENTER} rounded-8 bg-surface absolute inset-x-32 top-23 h-211 px-18 pt-17`}>
      {STEPS.map((step) => (
        <li key={step.title} className="relative flex h-47.5 items-start gap-14">
          <span className={`mt-2 grid size-17 shrink-0 place-items-center rounded-full ${STEP_DOT[step.state]}`}>
            {step.state === "done" && (
              <svg viewBox="0 0 10 10" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M2 5.2 4.2 7.2 8 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="flex-1">
            <span className="type-body-14 text-fg-strong block leading-tight">{step.title}</span>
            <span className="type-caption-12 mt-3 block text-black/40">{step.caption}</span>
          </span>
          {"pill" in step && (
            <span
              className={`type-caption-12 rounded-6 -mt-3 flex h-24 items-center px-12 ${
                step.state === "active" ? "bg-warning/12 text-fg-strong" : "bg-surface-subtle text-black/60"
              }`}
            >
              {step.pill}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function MaintenanceMockup() {
  const rows = [
    { title: "Small technical fixes", caption: "12 open issues", count: 12 },
    { title: "Security updates", caption: "4 pending", count: 4 },
    { title: "Plugin updates", caption: "9 backlog items", count: 9 },
  ];
  return (
    <RowList>
      {rows.map(({ title, caption, count }, i) => (
        <ListRow
          key={title}
          index={i}
          title={title}
          caption={caption}
          right={
            <>
              <span className="type-body-14 rounded-6 bg-surface-subtle text-fg-strong grid size-30 place-items-center">
                {count}
              </span>
              <Kebab />
            </>
          }
        />
      ))}
    </RowList>
  );
}
