import {
  buildSlug,
  createJobSchema,
  deadlineProblem,
  dhakaDate,
  escapeLike,
  isAcceptingApplications,
  MAX_QUESTIONS,
  normalizeAmount,
  reopenJobSchema,
  salaryProblem,
  slugify,
  updateJobSchema,
} from "./job";

const valid = {
  title: "  Senior Designer ",
  jobType: "full_time",
  workMode: "hybrid",
  vacancies: 2,
  location: "Dhaka",
  officeTiming: "Mon - Fri, 11 AM to 6 PM",
  description: "Design things.",
  deadlineOn: "2026-12-31",
};

describe("dhakaDate", () => {
  it("uses the calendar day in Dhaka (UTC+6), not in UTC", () => {
    expect(dhakaDate(new Date("2026-11-01T17:59:59Z"))).toBe("2026-11-01");
    expect(dhakaDate(new Date("2026-11-01T18:00:00Z"))).toBe("2026-11-02");
  });
});

describe("isAcceptingApplications", () => {
  const now = new Date("2026-11-02T10:00:00Z"); // 16:00 on 2 Nov in Dhaka

  it("accepts an open job through the end of its deadline day", () => {
    expect(isAcceptingApplications({ status: "open", deadlineOn: "2026-11-02" }, now)).toBe(true);
    expect(isAcceptingApplications({ status: "open", deadlineOn: "2026-11-03" }, now)).toBe(true);
  });

  it("stops the day after the deadline in Dhaka, even when it is still the deadline day in UTC", () => {
    expect(isAcceptingApplications({ status: "open", deadlineOn: "2026-11-01" }, now)).toBe(false);
    const lateEvening = new Date("2026-11-02T18:30:00Z"); // 00:30 on 3 Nov in Dhaka
    expect(isAcceptingApplications({ status: "open", deadlineOn: "2026-11-02" }, lateEvening)).toBe(false);
  });

  it("never accepts a draft or a closed job", () => {
    expect(isAcceptingApplications({ status: "draft", deadlineOn: "2026-12-01" }, now)).toBe(false);
    expect(isAcceptingApplications({ status: "closed", deadlineOn: "2026-12-01" }, now)).toBe(false);
  });
});

describe("deadlineProblem", () => {
  const now = new Date("2026-11-02T10:00:00Z");

  it("allows today and later, rejects the past", () => {
    expect(deadlineProblem("2026-11-02", now)).toBeNull();
    expect(deadlineProblem("2027-01-01", now)).toBeNull();
    expect(deadlineProblem("2026-11-01", now)).toMatch(/past/);
  });
});

describe("salaryProblem", () => {
  it("accepts negotiable, fixed and range", () => {
    expect(salaryProblem(null, null)).toBeNull();
    expect(salaryProblem("50000", null)).toBeNull();
    expect(salaryProblem("50000", "50000")).toBeNull();
    expect(salaryProblem("50000.50", "80000")).toBeNull();
  });

  it("rejects a maximum without a minimum and a maximum below the minimum", () => {
    expect(salaryProblem(null, "80000")).toMatch(/minimum/);
    expect(salaryProblem("80000", "50000")).toMatch(/below/);
  });
});

describe("normalizeAmount", () => {
  it("drops the trailing zeros numeric(19,4) adds", () => {
    expect(normalizeAmount("50000.0000")).toBe("50000");
    expect(normalizeAmount("50000.5000")).toBe("50000.5");
    expect(normalizeAmount("50000.2500")).toBe("50000.25");
    expect(normalizeAmount("50000")).toBe("50000");
    expect(normalizeAmount("100.0000")).toBe("100");
    expect(normalizeAmount(null)).toBeNull();
  });
});

describe("slugs", () => {
  it("makes lowercase dashed ASCII", () => {
    expect(slugify("Senior Designer (UI/UX)")).toBe("senior-designer-ui-ux");
    expect(slugify("  --Café Manager--  ")).toBe("cafe-manager");
  });

  it("falls back to `job` when nothing usable is left", () => {
    expect(slugify("সিনিয়র ডিজাইনার")).toBe("job");
    expect(slugify("!!!")).toBe("job");
  });

  it("caps the length without ending on a dash", () => {
    const slug = slugify(`${"a".repeat(49)} b c d`);
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("adds the suffix", () => {
    expect(buildSlug("Senior Designer", "7f3a9c")).toBe("senior-designer-7f3a9c");
  });
});

describe("escapeLike", () => {
  it("escapes the wildcard characters", () => {
    expect(escapeLike("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });
});

describe("createJobSchema", () => {
  it("trims, applies defaults and drops nothing needed", () => {
    const job = createJobSchema.parse(valid);
    expect(job).toMatchObject({
      title: "Senior Designer",
      requirements: "",
      benefits: "",
      salaryMin: null,
      salaryMax: null,
      publish: false,
      questions: [],
    });
  });

  it("defaults a question to required and ignores an id on a new job", () => {
    const job = createJobSchema.parse({
      ...valid,
      questions: [{ text: "  Why us? ", id: "6f1c3f4a-0000-4000-8000-000000000000" }],
    });
    expect(job.questions).toEqual([{ text: "Why us?", required: true }]);
  });

  it.each([
    ["an empty title", { title: "  " }],
    ["a bad job type", { jobType: "internship" }],
    ["zero vacancies", { vacancies: 0 }],
    ["a fractional vacancy count", { vacancies: 1.5 }],
    ["a malformed deadline", { deadlineOn: "31/12/2026" }],
    ["an impossible date", { deadlineOn: "2026-02-30" }],
    ["a salary with three decimals", { salaryMin: "10.123" }],
    ["a negative salary", { salaryMin: "-5" }],
    ["a salary as a float-looking exponent", { salaryMin: "1e5" }],
    ["a maximum without a minimum", { salaryMax: "5000" }],
    ["a maximum below the minimum", { salaryMin: "9000", salaryMax: "5000" }],
    ["too many questions", { questions: Array.from({ length: MAX_QUESTIONS + 1 }, (_, n) => ({ text: `Q${n}` })) }],
    ["an empty question", { questions: [{ text: " " }] }],
  ])("rejects %s", (_name, patch) => {
    expect(createJobSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("updateJobSchema", () => {
  it("allows a single field", () => {
    expect(updateJobSchema.parse({ vacancies: 3 })).toEqual({ vacancies: 3 });
  });

  it("allows only questions, keeping ids", () => {
    const id = "6f1c3f4a-0000-4000-8000-000000000000";
    expect(updateJobSchema.parse({ questions: [{ id, text: "Q", required: false }, { text: "New" }] }).questions).toEqual([
      { id, text: "Q", required: false },
      { text: "New", required: true },
    ]);
  });

  it("rejects an empty change and a bad value", () => {
    expect(updateJobSchema.safeParse({}).success).toBe(false);
    expect(updateJobSchema.safeParse({ vacancies: 0 }).success).toBe(false);
    expect(updateJobSchema.safeParse({ questions: [{ id: "nope", text: "Q" }] }).success).toBe(false);
  });
});

describe("reopenJobSchema", () => {
  it("takes an optional deadline", () => {
    expect(reopenJobSchema.parse({})).toEqual({});
    expect(reopenJobSchema.parse({ deadlineOn: "2027-01-01" })).toEqual({ deadlineOn: "2027-01-01" });
    expect(reopenJobSchema.safeParse({ deadlineOn: "soon" }).success).toBe(false);
  });
});
