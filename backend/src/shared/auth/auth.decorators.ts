import { createParamDecorator, type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

export const IS_PUBLIC = "auth:public";
export const REQUIRED_PERMISSION = "auth:permission";

/** No session needed. Every endpoint is private unless it says this, and a public one is called out in review (RULES.md section 4). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The permission (`module.resource.action`) the endpoint needs. The service layer still checks it for the data it touches. */
export const RequirePermission = (permission: string) => SetMetadata(REQUIRED_PERMISSION, permission);

/** Who is making the request. Set by `AuthGuard` on every non-public endpoint. */
export interface AuthContext {
  userId: string;
  sessionId: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export type AuthenticatedRequest = FastifyRequest & { auth?: AuthContext };

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext): AuthContext => {
  const auth = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  if (!auth) throw new Error("CurrentAuth used on a public endpoint");
  return auth;
});
