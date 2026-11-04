import {
  createCaseStudySchema,
  escapeLike,
  imageFolder,
  listCaseStudiesQuerySchema,
  publishProblem,
  reorderCaseStudiesSchema,
  slugify,
  updateCaseStudySchema,
} from "./case-study";

const valid = {
  title: "Royal Safari Tours",
  summary: "A tour website and booking dashboard.",
  client: "Royal Safari Tours",
  service: "website-infrastructure",
  category: "website-infrastructure",
  description: "A full build.",
  challenge: "Present tours clearly.",
};

const stats = (count: number) => Array.from({ length: count }, (_, i) => ({ value: `${i}`, label: `Result ${i}` }));

describe("slugify", () => {
  it("makes lowercase dashed words", () => {
    expect(slugify("Royal Safari Tours")).toBe("royal-safari-tours");
    expect(slugify("  Power Bank (Bangladesh)!  ")).toBe("power-bank-bangladesh");
    expect(slugify("New York Clean Team")).toBe("new-york-clean-team");
  });

  it("drops accents and symbols, and falls back when nothing is left", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
    expect(slugify("টুর")).toBe("case-study");
    expect(slugify("///")).toBe("case-study");
  });

  it("is at most 60 characters and never ends in a dash", () => {
    const slug = slugify(`${"word ".repeat(30)}end`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("always produces something the slug rule accepts", () => {
    const result = createCaseStudySchema.safeParse({ ...valid, slug: slugify("Any Title 2026") });
    expect(result.success).toBe(true);
  });
});

describe("imageFolder", () => {
  it("is the study's own folder in the public bucket, ending with a slash", () => {
    expect(imageFolder("royal-safari-tours")).toBe("case-study/royal-safari-tours/");
  });
});

describe("createCaseStudySchema", () => {
  it("applies defaults for the optional parts", () => {
    const parsed = createCaseStudySchema.parse(valid);
    expect(parsed).toMatchObject({ tags: [], stats: [], seoTitle: "", seoDescription: "" });
    expect(parsed.slug).toBeUndefined();
  });

  it("accepts exactly four results or none", () => {
    expect(createCaseStudySchema.safeParse({ ...valid, stats: stats(4) }).success).toBe(true);
    expect(createCaseStudySchema.safeParse({ ...valid, stats: [] }).success).toBe(true);
    for (const count of [1, 2, 3, 5]) {
      expect(createCaseStudySchema.safeParse({ ...valid, stats: stats(count) }).success).toBe(false);
    }
  });

  it("accepts only the four known services", () => {
    expect(createCaseStudySchema.safeParse({ ...valid, service: "ad-tech", category: "erp-business-systems" }).success).toBe(
      true,
    );
    expect(createCaseStudySchema.safeParse({ ...valid, service: "seo" }).success).toBe(false);
    expect(createCaseStudySchema.safeParse({ ...valid, category: "all" }).success).toBe(false);
  });

  it("limits tags and trims text", () => {
    expect(createCaseStudySchema.safeParse({ ...valid, tags: Array.from({ length: 9 }, (_, i) => `t${i}`) }).success).toBe(false);
    expect(createCaseStudySchema.safeParse({ ...valid, tags: [""] }).success).toBe(false);
    expect(createCaseStudySchema.parse({ ...valid, title: "  Spaced  " }).title).toBe("Spaced");
    expect(createCaseStudySchema.safeParse({ ...valid, title: "   " }).success).toBe(false);
  });

  it("only takes a safe slug", () => {
    for (const slug of ["ok", "royal-safari-tours", "a1-b2"]) {
      expect(createCaseStudySchema.safeParse({ ...valid, slug }).success).toBe(true);
    }
    for (const slug of ["Upper", "two  spaces", "-lead", "trail-", "dou--ble", "a/b", "../x", "", "x".repeat(61)]) {
      expect(createCaseStudySchema.safeParse({ ...valid, slug }).success).toBe(false);
    }
  });
});

describe("updateCaseStudySchema", () => {
  it("takes any subset of fields", () => {
    expect(updateCaseStudySchema.parse({ title: "New" })).toEqual({ title: "New" });
  });

  it("needs at least one field, and ignores the slug (it never changes)", () => {
    expect(updateCaseStudySchema.safeParse({}).success).toBe(false);
    expect(updateCaseStudySchema.safeParse({ slug: "new-slug" }).success).toBe(false);
  });

  it("checks the number of results only when they are sent", () => {
    expect(updateCaseStudySchema.safeParse({ stats: stats(2) }).success).toBe(false);
    expect(updateCaseStudySchema.safeParse({ stats: stats(4) }).success).toBe(true);
    expect(updateCaseStudySchema.safeParse({ stats: [] }).success).toBe(true);
  });
});

describe("listCaseStudiesQuerySchema", () => {
  it("defaults to the display order", () => {
    expect(listCaseStudiesQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20, sort: "sortOrder", order: "asc" });
  });

  it("caps the page size and rejects unknown values", () => {
    expect(listCaseStudiesQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(listCaseStudiesQuerySchema.safeParse({ status: "archived" }).success).toBe(false);
    expect(listCaseStudiesQuerySchema.safeParse({ sort: "client" }).success).toBe(false);
  });
});

describe("reorderCaseStudiesSchema", () => {
  it("needs at least one id and only ids", () => {
    expect(reorderCaseStudiesSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(reorderCaseStudiesSchema.safeParse({ ids: ["nope"] }).success).toBe(false);
    expect(reorderCaseStudiesSchema.safeParse({ ids: ["0196a000-0000-7000-8000-000000000001"] }).success).toBe(true);
  });
});

describe("publishProblem", () => {
  it("needs an image and its alt text", () => {
    expect(publishProblem({ imageKey: null, imageAlt: null })).toMatch(/image/i);
    expect(publishProblem({ imageKey: "case-study/a/image1.png", imageAlt: null })).toMatch(/alt/i);
    expect(publishProblem({ imageKey: "case-study/a/image1.png", imageAlt: "   " })).toMatch(/alt/i);
    expect(publishProblem({ imageKey: "case-study/a/image1.png", imageAlt: "A tablet" })).toBeNull();
  });
});

describe("escapeLike", () => {
  it("escapes wildcards so a search matches literally", () => {
    expect(escapeLike("100%_done\\")).toBe("100\\%\\_done\\\\");
  });
});
