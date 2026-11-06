import {
  applyChange,
  buildTimeline,
  changedFields,
  effectiveDateProblem,
  type EmploymentState,
  suggestReason,
  type TimelineRecord,
} from "./employment-record";

const intern: EmploymentState = {
  designation: "Marketing Intern",
  employmentType: "internship",
  workMode: "onsite",
  salary: "15000.0000",
  departmentId: "d1",
  managerId: null,
};

describe("changedFields", () => {
  it("lists only what differs", () => {
    expect(changedFields(intern, { ...intern, employmentType: "full_time" })).toEqual(["employmentType"]);
    expect(changedFields(intern, { ...intern, designation: "Marketing Executive", salary: "25000" })).toEqual([
      "designation",
      "salary",
    ]);
  });

  it("treats 15000.0000 from the database and 15000 from a form as the same salary", () => {
    expect(changedFields(intern, { ...intern, salary: "15000" })).toEqual([]);
    expect(changedFields(intern, { ...intern, salary: "15000.00" })).toEqual([]);
    expect(changedFields(intern, { ...intern, salary: "15000.50" })).toEqual(["salary"]);
  });

  it("sees a manager being added or removed", () => {
    expect(changedFields(intern, { ...intern, managerId: "m1" })).toEqual(["managerId"]);
  });
});

describe("applyChange", () => {
  it("carries forward whatever the change leaves out", () => {
    expect(applyChange(intern, { employmentType: "full_time" })).toEqual({ ...intern, employmentType: "full_time" });
  });

  it("can clear a manager or department with an explicit null, but not with a missing key", () => {
    const managed = { ...intern, managerId: "m1" };
    expect(applyChange(managed, { managerId: null }).managerId).toBeNull();
    expect(applyChange(managed, {}).managerId).toBe("m1");
  });
});

describe("suggestReason", () => {
  it("picks the reason that fits", () => {
    expect(suggestReason(["designation"])).toBe("promotion");
    expect(suggestReason(["designation", "salary"])).toBe("promotion");
    expect(suggestReason(["employmentType"])).toBe("role_type_change");
    expect(suggestReason(["employmentType", "salary"])).toBe("role_type_change");
    expect(suggestReason(["salary"])).toBe("salary_revision");
    expect(suggestReason(["departmentId"])).toBe("department_transfer");
    expect(suggestReason(["managerId"])).toBe("manager_change");
    expect(suggestReason(["workMode"])).toBe("work_mode_change");
  });
});

describe("effectiveDateProblem", () => {
  const base = { joinedOn: "2026-01-10", leftOn: null };

  it("accepts the joining day, later days and future days", () => {
    expect(effectiveDateProblem({ ...base, effectiveFrom: "2026-01-10" })).toBeNull();
    expect(effectiveDateProblem({ ...base, effectiveFrom: "2030-01-01" })).toBeNull();
  });

  it("refuses a day before joining", () => {
    expect(effectiveDateProblem({ ...base, effectiveFrom: "2026-01-09" })).toMatch(/before the joining date/);
  });

  it("refuses a day after the leaving date, but accepts the leaving date itself", () => {
    expect(effectiveDateProblem({ ...base, leftOn: "2026-06-30", effectiveFrom: "2026-06-30" })).toBeNull();
    expect(effectiveDateProblem({ ...base, leftOn: "2026-06-30", effectiveFrom: "2026-07-01" })).toMatch(
      /after the leaving date/,
    );
  });
});

describe("buildTimeline", () => {
  const record = (id: string, effectiveFrom: string, patch: Partial<TimelineRecord> = {}): TimelineRecord => ({
    id,
    effectiveFrom,
    reason: "joined",
    ...intern,
    ...patch,
  });

  const records = [
    record("r1", "2026-11-01"),
    record("r2", "2027-02-01", { reason: "role_type_change", designation: "Marketing Intern", employmentType: "full_time" }),
    record("r3", "2027-08-01", {
      reason: "promotion",
      designation: "Marketing Executive",
      employmentType: "full_time",
      salary: "25000",
    }),
  ];

  it("runs each stint until the next one starts and the last one to Present", () => {
    const blocks = buildTimeline(records, null, "2027-10-06");
    expect(blocks.map((block) => block.endsOn)).toEqual(["2027-01-31", "2027-07-31", null]);
    expect(blocks.map((block) => block.status)).toEqual(["past", "past", "current"]);
    expect(blocks[0]!.period).toMatchObject({ years: 0, months: 3, days: 0 });
    expect(blocks[2]!.period).toMatchObject({ years: 0, months: 2, days: 5 });
  });

  it("records what changed between stints", () => {
    const blocks = buildTimeline(records, null, "2027-10-06");
    expect(blocks[0]!.changes).toEqual([]);
    expect(blocks[1]!.changes).toEqual([{ field: "employmentType", from: "internship", to: "full_time" }]);
    expect(blocks[2]!.changes.map((change) => change.field)).toEqual(["designation", "salary"]);
  });

  it("marks a record dated in the future as scheduled, with no length yet", () => {
    const blocks = buildTimeline(records, null, "2027-03-01");
    expect(blocks.map((block) => block.status)).toEqual(["past", "current", "scheduled"]);
    expect(blocks[2]!.period).toBeNull();
    expect(blocks[1]!.endsOn).toBe("2027-07-31");
  });

  it("marks everything scheduled before the employee has started", () => {
    const blocks = buildTimeline(records, null, "2026-10-01");
    expect(blocks.map((block) => block.status)).toEqual(["scheduled", "scheduled", "scheduled"]);
  });

  it("ends the last stint at the leaving date and stops counting there", () => {
    const blocks = buildTimeline(records, "2027-09-30", "2027-12-01");
    expect(blocks[2]!.endsOn).toBe("2027-09-30");
    expect(blocks[2]!.period).toMatchObject({ months: 2, days: 0 });
  });

  it("keeps counting to today while a leaving date is still ahead", () => {
    const blocks = buildTimeline(records, "2028-01-31", "2027-10-06");
    expect(blocks[2]!.endsOn).toBe("2028-01-31");
    expect(blocks[2]!.period).toMatchObject({ months: 2, days: 5 });
  });
});
