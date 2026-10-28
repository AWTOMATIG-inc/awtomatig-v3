import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ZodValidationException } from "nestjs-zod";
import type { ZodError } from "zod";

import { AppError, type ErrorKind } from "./app-error";

/** The one error shape every endpoint returns (RULES.md section 4). */
export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

const STATUS_BY_KIND: Record<ErrorKind, number> = {
  validation: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  unavailable: HttpStatus.SERVICE_UNAVAILABLE,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = this.toResponse(exception);
    if (status >= 500) {
      this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    }
    const response: unknown = host.switchToHttp().getResponse();
    this.httpAdapterHost.httpAdapter.reply(response, body, status);
  }

  private toResponse(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof AppError) {
      const body: ErrorBody = { code: exception.code, message: exception.message };
      if (exception.details !== undefined) body.details = exception.details;
      return { status: STATUS_BY_KIND[exception.kind], body };
    }

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as ZodError;
      const details = zodError.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message, code: issue.code }));
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { code: "VALIDATION_FAILED", message: "The request is not valid", details },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // 5xx messages can describe internals, so they are replaced; 4xx messages are written for the client.
      if (status >= 500) return { status, body: { code: this.codeFor(status), message: "Internal server error" } };
      return { status, body: { code: this.codeFor(status), message: this.messageOf(exception) } };
    }

    return { status: 500, body: { code: "INTERNAL_ERROR", message: "Internal server error" } };
  }

  private codeFor(status: number): string {
    return HttpStatus[status] ?? "ERROR";
  }

  private messageOf(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === "string") return response;
    const message = (response as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join("; ");
    return typeof message === "string" ? message : exception.message;
  }
}
