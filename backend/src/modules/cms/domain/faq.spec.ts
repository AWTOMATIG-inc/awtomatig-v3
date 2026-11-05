import {
  ANSWER_MAX_LENGTH,
  createFaqSchema,
  listFaqsQuerySchema,
  MAX_PUBLISHED_FAQS,
  publishProblem,
  QUESTION_MAX_LENGTH,
  reorderFaqsSchema,
  updateFaqSchema,
} from "./faq";

describe("faq domain", () => {
  const valid = { question: "Do you work with existing websites?", answer: "Yes, we can." };

  describe("createFaqSchema", () => {
    it("accepts a question and an answer and trims them", () => {
      expect(createFaqSchema.parse({ question: "  Why?  ", answer: "  Because.  " })).toEqual({
        question: "Why?",
        answer: "Because.",
      });
    });

    it("keeps line breaks inside the answer", () => {
      expect(createFaqSchema.parse({ ...valid, answer: "One.\nTwo." }).answer).toBe("One.\nTwo.");
    });

    it("accepts the longest question and answer and refuses one character more", () => {
      expect(
        createFaqSchema.safeParse({ question: "q".repeat(QUESTION_MAX_LENGTH), answer: "a".repeat(ANSWER_MAX_LENGTH) }).success,
      ).toBe(true);
      expect(createFaqSchema.safeParse({ ...valid, question: "q".repeat(QUESTION_MAX_LENGTH + 1) }).success).toBe(false);
      expect(createFaqSchema.safeParse({ ...valid, answer: "a".repeat(ANSWER_MAX_LENGTH + 1) }).success).toBe(false);
    });

    it("refuses empty and whitespace-only text and a missing field", () => {
      expect(createFaqSchema.safeParse({ ...valid, question: "   " }).success).toBe(false);
      expect(createFaqSchema.safeParse({ ...valid, answer: "" }).success).toBe(false);
      expect(createFaqSchema.safeParse({ question: "Only a question" }).success).toBe(false);
    });

    it("ignores fields it does not own, such as status or position", () => {
      expect(createFaqSchema.parse({ ...valid, status: "published", sortOrder: 0 })).toEqual(valid);
    });
  });

  describe("updateFaqSchema", () => {
    it("accepts one field", () => {
      expect(updateFaqSchema.parse({ answer: "New." })).toEqual({ answer: "New." });
    });

    it("refuses an empty change", () => {
      expect(updateFaqSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("listFaqsQuerySchema", () => {
    it("has defaults and refuses an unknown status or an oversized page", () => {
      expect(listFaqsQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20, sort: "sortOrder", order: "asc" });
      expect(listFaqsQuerySchema.safeParse({ status: "archived" }).success).toBe(false);
      expect(listFaqsQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
    });
  });

  describe("reorderFaqsSchema", () => {
    it("needs at least one valid id", () => {
      expect(reorderFaqsSchema.safeParse({ ids: [] }).success).toBe(false);
      expect(reorderFaqsSchema.safeParse({ ids: ["nope"] }).success).toBe(false);
      expect(reorderFaqsSchema.safeParse({ ids: ["0199b6c1-1f6e-7c0b-9c15-d494eb9eb06d"] }).success).toBe(true);
    });
  });

  describe("publishProblem", () => {
    it("allows publishing below the cap and refuses at it", () => {
      expect(publishProblem(MAX_PUBLISHED_FAQS - 1)).toBeNull();
      expect(publishProblem(MAX_PUBLISHED_FAQS)).toContain(String(MAX_PUBLISHED_FAQS));
    });
  });
});
