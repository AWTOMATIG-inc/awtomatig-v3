import { z } from "zod";

const name = z.string().trim().min(2).max(80);
const description = z.string().trim().max(300);

export const createDepartmentSchema = z.object({ name, description: description.default("") });
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z
  .object({ name, description })
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "Send at least one field to change" });
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const listDepartmentsQuerySchema = z.object({
  /** Leave out to get every department; the Add employee form asks for `active` only. */
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
