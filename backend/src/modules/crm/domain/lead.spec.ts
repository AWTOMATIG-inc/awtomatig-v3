import {
  captureLeadSchema,
  escapeLike,
  isTimeZone,
  leadStatsQuerySchema,
  listLeadsQuerySchema,
  statsBucket,
  updateLeadSchema,
} from "./lead";

const valid = {
  submissionId: "0197a1b2-0000-7000-8000-000000000001",
  name: "  Ada Lovelace ",
  email: "Ada@Example.COM",
  company: "Analytical Engines",
  budget: "$5k – $15k",
  helpWith: "Web development",
  projectType: "New project",
  message: "We want to rebuild our storefront.",
  consent: true,
};

describe("captureLeadSchema", () => {
  it("trims text and lowercases the email", () => {
    const lead = captureLeadSchema.parse(valid);
    expect(lead.name).toBe("Ada Lovelace");
    expect(lead.email).toBe("ada@example.com");
    expect(lead.source).toBe("website-contact");
  });

  it("allows an empty company and budget", () => {
    expect(captureLeadSchema.parse({ ...valid, company: undefined, budget: "" })).toMatchObject({ company: "", budget: "" });
  });

  it.each([
    ["no consent", { consent: false }],
    ["a bad email", { email: "not-an-email" }],
    ["an empty name", { name: "   " }],
    ["a too long message", { message: "x".repeat(5001) }],
    ["a bad submission id", { submissionId: "123" }],
  ])("rejects %s", (_label, patch) => {
    expect(captureLeadSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("listLeadsQuerySchema", () => {
  it("applies defaults and coerces numbers from the query string", () => {
    expect(listLeadsQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20, sort: "createdAt", order: "desc" });
    expect(listLeadsQuerySchema.parse({ page: "3", pageSize: "50" })).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("caps the page size and rejects an unknown status or sort", () => {
    expect(listLeadsQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(listLeadsQuerySchema.safeParse({ status: "archived" }).success).toBe(false);
    expect(listLeadsQuerySchema.safeParse({ sort: "email" }).success).toBe(false);
  });
});

describe("updateLeadSchema", () => {
  it("needs a status or notes", () => {
    expect(updateLeadSchema.safeParse({}).success).toBe(false);
    expect(updateLeadSchema.safeParse({ status: "contacted" }).success).toBe(true);
    expect(updateLeadSchema.safeParse({ notes: null }).success).toBe(true);
  });
});

describe("statsBucket", () => {
  it("uses days for a week or less and weeks beyond", () => {
    expect(statsBucket(7)).toEqual({ unit: "day", count: 7 });
    expect(statsBucket(30)).toEqual({ unit: "week", count: 5 });
    expect(statsBucket(90)).toEqual({ unit: "week", count: 13 });
  });
});

describe("time zones", () => {
  it("accepts IANA names and rejects anything else", () => {
    expect(isTimeZone("Asia/Dhaka")).toBe(true);
    expect(isTimeZone("UTC")).toBe(true);
    expect(isTimeZone("Mars/Olympus")).toBe(false);
    expect(leadStatsQuerySchema.safeParse({ timeZone: "'; drop table x; --" }).success).toBe(false);
  });
});

describe("escapeLike", () => {
  it("makes wildcards literal", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});
