import {
  createTestimonialSchema,
  editProblem,
  listTestimonialsQuerySchema,
  logoFolder,
  publishProblem,
  QUOTE_MAX_LENGTH,
  reorderTestimonialsSchema,
  updateTestimonialSchema,
} from "./testimonial";

const valid = {
  quote: "They automated our onboarding from end to end.",
  name: "Carlos Mendez",
  role: "Founder & Managing Partner",
  company: "No Spain No Gain",
  service: "back-office-operations",
};

describe("createTestimonialSchema", () => {
  it("accepts a complete testimonial and defaults both flags to false", () => {
    const parsed = createTestimonialSchema.parse(valid);
    expect(parsed).toMatchObject({ ...valid, consentConfirmed: false, logoInBlack: false });
  });

  it("keeps the flags that are sent", () => {
    const parsed = createTestimonialSchema.parse({ ...valid, consentConfirmed: true, logoInBlack: true });
    expect(parsed).toMatchObject({ consentConfirmed: true, logoInBlack: true });
  });

  it("trims the text fields", () => {
    const parsed = createTestimonialSchema.parse({ ...valid, quote: "  Great work.  ", name: "  Sam  " });
    expect(parsed).toMatchObject({ quote: "Great work.", name: "Sam" });
  });

  it("refuses an empty or whitespace-only field", () => {
    for (const field of ["quote", "name", "role", "company"] as const) {
      expect(createTestimonialSchema.safeParse({ ...valid, [field]: "   " }).success).toBe(false);
      expect(createTestimonialSchema.safeParse({ ...valid, [field]: undefined }).success).toBe(false);
    }
  });

  it("limits the quote to 600 characters", () => {
    expect(createTestimonialSchema.safeParse({ ...valid, quote: "a".repeat(QUOTE_MAX_LENGTH) }).success).toBe(true);
    expect(createTestimonialSchema.safeParse({ ...valid, quote: "a".repeat(QUOTE_MAX_LENGTH + 1) }).success).toBe(false);
  });

  it("limits name, role and company to 120 characters", () => {
    expect(createTestimonialSchema.safeParse({ ...valid, name: "a".repeat(120) }).success).toBe(true);
    expect(createTestimonialSchema.safeParse({ ...valid, name: "a".repeat(121) }).success).toBe(false);
    expect(createTestimonialSchema.safeParse({ ...valid, role: "a".repeat(121) }).success).toBe(false);
    expect(createTestimonialSchema.safeParse({ ...valid, company: "a".repeat(121) }).success).toBe(false);
  });

  it("accepts only the four service ids", () => {
    for (const service of ["website-infrastructure", "back-office-operations", "erp-business-systems", "ad-tech"]) {
      expect(createTestimonialSchema.safeParse({ ...valid, service }).success).toBe(true);
    }
    expect(createTestimonialSchema.safeParse({ ...valid, service: "seo" }).success).toBe(false);
  });

  it("refuses flags that are not booleans", () => {
    expect(createTestimonialSchema.safeParse({ ...valid, consentConfirmed: "yes" }).success).toBe(false);
    expect(createTestimonialSchema.safeParse({ ...valid, logoInBlack: 1 }).success).toBe(false);
  });
});

describe("updateTestimonialSchema", () => {
  it("accepts any single field", () => {
    expect(updateTestimonialSchema.safeParse({ quote: "New quote." }).success).toBe(true);
    expect(updateTestimonialSchema.safeParse({ consentConfirmed: true }).success).toBe(true);
    expect(updateTestimonialSchema.safeParse({ logoInBlack: false }).success).toBe(true);
  });

  it("refuses an empty change, including one that only names unknown fields", () => {
    expect(updateTestimonialSchema.safeParse({}).success).toBe(false);
    expect(updateTestimonialSchema.safeParse({ status: "published" }).success).toBe(false);
  });

  it("applies the same limits as creating", () => {
    expect(updateTestimonialSchema.safeParse({ quote: "a".repeat(601) }).success).toBe(false);
    expect(updateTestimonialSchema.safeParse({ name: " " }).success).toBe(false);
    expect(updateTestimonialSchema.safeParse({ service: "seo" }).success).toBe(false);
  });
});

describe("listTestimonialsQuerySchema", () => {
  it("defaults to the first page in display order", () => {
    expect(listTestimonialsQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20, sort: "sortOrder", order: "asc" });
  });

  it("caps the page size at 100 and refuses unknown sort fields and statuses", () => {
    expect(listTestimonialsQuerySchema.safeParse({ pageSize: "100" }).success).toBe(true);
    expect(listTestimonialsQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(listTestimonialsQuerySchema.safeParse({ sort: "quote" }).success).toBe(false);
    expect(listTestimonialsQuerySchema.safeParse({ status: "archived" }).success).toBe(false);
  });
});

describe("reorderTestimonialsSchema", () => {
  it("needs at least one uuid", () => {
    expect(reorderTestimonialsSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(reorderTestimonialsSchema.safeParse({ ids: ["nope"] }).success).toBe(false);
    expect(reorderTestimonialsSchema.safeParse({ ids: ["0192f0a4-7d1e-7f63-8f0e-0123456789ab"] }).success).toBe(true);
  });
});

describe("publishProblem", () => {
  it("needs the client's agreement", () => {
    expect(publishProblem({ consentConfirmed: false })).toMatch(/agreed/i);
    expect(publishProblem({ consentConfirmed: true })).toBeNull();
  });
});

describe("editProblem", () => {
  it("does not let a live testimonial lose the client's agreement", () => {
    expect(editProblem({ status: "published" }, { consentConfirmed: false })).toMatch(/unpublish/i);
  });

  it("allows everything else", () => {
    expect(editProblem({ status: "published" }, { consentConfirmed: true })).toBeNull();
    expect(editProblem({ status: "published" }, { quote: "New." })).toBeNull();
    expect(editProblem({ status: "draft" }, { consentConfirmed: false })).toBeNull();
  });
});

describe("logoFolder", () => {
  it("is named by the row id and ends with a slash, so a prefix never matches another testimonial", () => {
    expect(logoFolder("0192b5e0-7c1d-7a3e-8f10-1234567890ab")).toBe("testimonial/0192b5e0-7c1d-7a3e-8f10-1234567890ab/");
  });
});
