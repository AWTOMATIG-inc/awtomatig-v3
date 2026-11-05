import { z } from "zod";

import type { components } from "@/lib/api/schema";

import { ANSWER_MAX_LENGTH, type Faq, QUESTION_MAX_LENGTH } from "./faqs";

export type CreateFaqBody = components["schemas"]["CreateFaqDto"];
export type UpdateFaqBody = components["schemas"]["UpdateFaqDto"];

export interface FaqFormValues {
  question: string;
  answer: string;
}

/** The checks that give feedback while typing. The backend repeats all of them and has the final word. */
export const faqFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Enter the question")
    .max(QUESTION_MAX_LENGTH, `Use ${QUESTION_MAX_LENGTH} characters or fewer`),
  answer: z.string().trim().min(1, "Enter the answer").max(ANSWER_MAX_LENGTH, `Use ${ANSWER_MAX_LENGTH} characters or fewer`),
});

export function toFormValues(faq?: Faq): FaqFormValues {
  return { question: faq?.question ?? "", answer: faq?.answer ?? "" };
}

/** Create and update send the same two fields. */
export function toBody(values: FaqFormValues): CreateFaqBody {
  return { question: values.question.trim(), answer: values.answer.trim() };
}
