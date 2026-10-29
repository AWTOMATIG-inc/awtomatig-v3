import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ForbiddenError, UnauthorizedError } from "../errors/app-error";
import { RbacService } from "../rbac/rbac.service";
import { type AuthenticatedRequest, IS_PUBLIC, REQUIRED_PERMISSION } from "./auth.decorators";
import { toHeaders } from "./auth.http";
import { AuthService } from "./auth.service";
import { hasPermission } from "./permissions";

/**
 * Global guard: every endpoint needs a signed-in employee unless it opts out with `@Public()`. `@RequirePermission()` adds the
 * permission check.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const result = await this.auth.getSession(toHeaders(request.headers));
    if (!result) throw new UnauthorizedError();

    const { user, session } = result;
    const grants = await this.rbac.grantsFor(user.id);
    request.auth = {
      userId: user.id,
      sessionId: session.id,
      name: user.name,
      email: user.email,
      roles: grants.roles,
      permissions: grants.permissions,
    };

    const required = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_PERMISSION, targets);
    if (required && !hasPermission(grants.permissions, required)) throw new ForbiddenError();
    return true;
  }
}
