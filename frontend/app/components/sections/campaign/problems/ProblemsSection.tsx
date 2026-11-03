import ProblemsBlock from "../../shared/problems/ProblemsBlock";
import type { Problem } from "../../shared/problems/problems";

// The illustrations show an example workflow, not claims about the visitor's business
const PROBLEMS: Problem[] = [
  {
    title: "Disconnected systems",
    description: "Website enquiries, CRM records, and spreadsheets sit apart, making information harder to keep consistent.",
    mockup: "systems",
    labels: ["CRM", "Staff records", "Spreadsheet", "Website", "Reporting"],
  },
  {
    title: "Limited visibility",
    description: "Managers need a clear view of enquiries, staff records, tasks, and what still needs attention.",
    mockup: "visibility",
    panel: {
      title: "Operations",
      subtitle: "Current work status",
      badge: "4 items",
      rows: [
        { label: "Enquiry owner", status: "Unassigned" },
        { label: "Quote follow-up", status: "Pending" },
        { label: "Time records", status: "Incomplete" },
        { label: "System sync", status: "Needs review" },
      ],
    },
  },
  {
    title: "Manual workflows",
    description: "Copying records and chasing updates takes time that your team could spend on clients and delivery.",
    mockup: "workflows",
    labels: ["Copy enquiry details", "Update CRM", "Notify manager", "Update spreadsheet"],
  },
  {
    title: "Unclear ownership",
    description: "When the next step has no clear owner, follow-ups and internal requests can remain unresolved.",
    mockup: "ownership",
    panel: {
      title: "Task ownership",
      subtitle: "People, tasks and next steps",
      rows: [
        { label: "Quote follow-up", status: "Unassigned" },
        { label: "CRM update", status: "Shared" },
        { label: "Time review", status: "Waiting" },
        { label: "Website issue", status: "No owner" },
      ],
    },
  },
];

// Campaign page: "When growth adds pressure", the Home Operations problem cards (with their animations) with their own copy
export default function ProblemsSection() {
  return (
    <section id="problems" aria-labelledby="problems-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container">
        <ProblemsBlock
          titleId="problems-title"
          paddingClassName="pt-60 lg:pt-90"
          bottomClassName="pb-60 lg:pb-90"
          eyebrow="When growth adds pressure"
          title={
            <>
              More clients.
              <br className="max-lg:hidden" /> More moving parts.
            </>
          }
          titleClassName="max-w-[10em]"
          description="As cleaning teams grow, disconnected tools and manual handoffs can make everyday work harder to manage."
          problems={PROBLEMS}
        />
      </div>
    </section>
  );
}
