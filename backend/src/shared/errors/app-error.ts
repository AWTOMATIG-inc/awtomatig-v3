/**
 * Typed domain errors. They carry no HTTP knowledge: `AllExceptionsFilter` maps `kind` to a status code in one place,
 * so domain/ and service/ code can throw them without importing the framework.
 */
export type ErrorKind = "validation" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unavailable";

export class AppError extends Error {
  constructor(
    readonly kind: ErrorKind,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request is not valid", details?: unknown) {
    super("validation", "VALIDATION_FAILED", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required") {
    super("unauthorized", "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do this") {
    super("forbidden", "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super("not_found", "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "The request conflicts with the current state", details?: unknown) {
    super("conflict", "CONFLICT", message, details);
  }
}

export class UnavailableError extends AppError {
  constructor(message = "The service is not available") {
    super("unavailable", "SERVICE_UNAVAILABLE", message);
  }
}
