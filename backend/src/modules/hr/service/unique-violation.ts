/** True for PostgreSQL's unique-violation error (23505), which drizzle may wrap with the driver error as `cause`. */
export function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown): unknown =>
    typeof value === "object" && value !== null ? (value as { code?: unknown }).code : undefined;
  const cause = typeof error === "object" && error !== null ? (error as { cause?: unknown }).cause : undefined;
  return code(error) === "23505" || code(cause) === "23505";
}
