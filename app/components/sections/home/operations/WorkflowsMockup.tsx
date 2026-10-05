import { DatabaseIcon } from "@/app/components/icons";

// Numbered hand-offs; every other step is pushed right and one is knocked askew
const STEPS = [
  { label: "Copy customer data", className: "" },
  { label: "Update CRM", className: "ml-14 -rotate-3" },
  { label: "Email Manager", className: "" },
  { label: "Update Spreadsheet", className: "ml-14" },
];

export default function WorkflowsMockup() {
  return (
    <ol className="flex flex-col gap-10 pt-28 pl-24">
      {STEPS.map((step, i) => (
        <li
          key={step.label}
          className={`type-body-14 flex h-49 w-351 items-center gap-14 rounded-8 bg-surface pr-7 pl-16 text-fg-primary ${step.className}`}
        >
          <span>{String(i + 1).padStart(2, "0")}.</span>
          <span>{step.label}</span>
          <span className="ml-auto grid size-34 place-items-center rounded-6 bg-surface-subtle">
            <DatabaseIcon className="size-20" />
          </span>
        </li>
      ))}
    </ol>
  );
}
