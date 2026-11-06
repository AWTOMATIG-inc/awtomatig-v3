import { createsManagerLoop } from "./org";
import {
  createEmployeeSchema,
  escapeLike,
  formatEmployeeId,
  leaveSchema,
  maskNid,
  normalizeAmount,
  parseEmployeeId,
  updateEmployeeSchema,
} from "./employee";

const valid = {
  fullName: "Jane Doe",
  email: "Jane.Doe@Example.com ",
  phone: "+880 1712-345678",
  address: "House 1, Road 2, Dhaka",
  nid: "1234567890",
  joinedOn: "2026-11-01",
  designation: "Marketing Intern",
  employmentType: "internship",
  workMode: "onsite",
};

describe("employee id", () => {
  it("is padded to four digits and grows past them", () => {
    expect(formatEmployeeId(7)).toBe("EMP-0007");
    expect(formatEmployeeId(1234)).toBe("EMP-1234");
    expect(formatEmployeeId(12345)).toBe("EMP-12345");
  });

  it("is read back from what people type", () => {
    expect(parseEmployeeId("EMP-0007")).toBe(7);
    expect(parseEmployeeId("emp7")).toBe(7);
    expect(parseEmployeeId(" emp-12 ")).toBe(12);
    expect(parseEmployeeId("jane")).toBeNull();
    expect(parseEmployeeId("EMP-")).toBeNull();
  });
});

describe("maskNid", () => {
  it("keeps only the last four digits", () => {
    expect(maskNid("1234567890")).toBe("******7890");
    expect(maskNid("12345678901234567")).toBe("*************4567");
  });
});

describe("normalizeAmount", () => {
  it("drops trailing zeros and keeps real decimals", () => {
    expect(normalizeAmount("15000.0000")).toBe("15000");
    expect(normalizeAmount("15000.5000")).toBe("15000.5");
    expect(normalizeAmount("15000")).toBe("15000");
    expect(normalizeAmount("0.0000")).toBe("0");
    expect(normalizeAmount(null)).toBeNull();
  });
});

describe("createEmployeeSchema", () => {
  it("accepts a valid employee and tidies it", () => {
    const parsed = createEmployeeSchema.parse(valid);
    expect(parsed.email).toBe("jane.doe@example.com");
    expect(parsed.salary).toBeNull();
    expect(parsed.departmentId).toBeNull();
    expect(parsed.managerId).toBeNull();
  });

  it("accepts NIDs of 10, 13 and 17 digits only", () => {
    for (const nid of ["1234567890", "1234567890123", "12345678901234567"])
      expect(createEmployeeSchema.safeParse({ ...valid, nid }).success).toBe(true);
    for (const nid of ["123456789", "12345678901", "123456789012345678", "12345abcde", "1234 567 890"])
      expect(createEmployeeSchema.safeParse({ ...valid, nid }).success).toBe(false);
  });

  it("checks limits", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, fullName: "J" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, fullName: "x".repeat(101) }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, address: "" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, address: "x".repeat(301) }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, designation: "x" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, designation: "x".repeat(81) }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, joinedOn: "2026-13-01" }).success).toBe(false);
  });

  it("only allows the fixed role types and work modes", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, employmentType: "freelance" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, workMode: "hybried" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, employmentType: "full_time", workMode: "hybrid" }).success).toBe(true);
  });

  it("takes salary as a decimal string with at most two decimals", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, salary: "25000" }).success).toBe(true);
    expect(createEmployeeSchema.safeParse({ ...valid, salary: "25000.50" }).success).toBe(true);
    expect(createEmployeeSchema.safeParse({ ...valid, salary: "0" }).success).toBe(true);
    expect(createEmployeeSchema.safeParse({ ...valid, salary: "-1" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, salary: "25000.555" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, salary: 25000 }).success).toBe(false);
  });
});

describe("updateEmployeeSchema", () => {
  it("needs at least one field and ignores employment fields", () => {
    expect(updateEmployeeSchema.safeParse({}).success).toBe(false);
    expect(updateEmployeeSchema.safeParse({ phone: "01712345678" }).success).toBe(true);
    const parsed = updateEmployeeSchema.parse({ phone: "01712345678", designation: "CEO", salary: "1" });
    expect(parsed).toEqual({ phone: "01712345678" });
  });
});

describe("leaveSchema", () => {
  it("tells apart no reassignment, nobody, and a person", () => {
    const base = { leftOn: "2026-12-31", exitType: "resigned" };
    expect(leaveSchema.parse(base).reassignReportsTo).toBeUndefined();
    expect(leaveSchema.parse({ ...base, reassignReportsTo: null }).reassignReportsTo).toBeNull();
    expect(leaveSchema.safeParse({ ...base, reassignReportsTo: "not-an-id" }).success).toBe(false);
    expect(leaveSchema.safeParse({ ...base, exitType: "fired" }).success).toBe(false);
  });
});

describe("escapeLike", () => {
  it("makes wildcard characters literal", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});

describe("createsManagerLoop", () => {
  const chain = (links: Record<string, string | null>) => (id: string) => Promise.resolve(links[id] ?? null);

  it("allows a manager with no manager above", async () => {
    expect(await createsManagerLoop("a", "b", chain({ b: null }))).toBe(false);
  });

  it("refuses managing yourself", async () => {
    expect(await createsManagerLoop("a", "a", chain({}))).toBe(true);
  });

  it("refuses a loop of two or more", async () => {
    expect(await createsManagerLoop("a", "b", chain({ b: "a" }))).toBe(true);
    expect(await createsManagerLoop("a", "c", chain({ c: "b", b: "a" }))).toBe(true);
  });

  it("allows a long chain that does not come back", async () => {
    expect(await createsManagerLoop("a", "d", chain({ d: "c", c: "b", b: null }))).toBe(false);
  });

  it("stops on a chain that already loops without involving this employee", async () => {
    expect(await createsManagerLoop("a", "b", chain({ b: "c", c: "b" }))).toBe(true);
  });
});
