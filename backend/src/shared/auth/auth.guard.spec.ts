import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ForbiddenError, UnauthorizedError } from "../errors/app-error";
import type { RbacService } from "../rbac/rbac.service";
import { type AuthenticatedRequest, IS_PUBLIC, REQUIRED_PERMISSION } from "./auth.decorators";
import { AuthGuard } from "./auth.guard";
import type { AuthService } from "./auth.service";

type Meta = Partial<Record<string, unknown>>;

function setup(options: { meta?: Meta; signedIn?: boolean; permissions?: string[] } = {}) {
  const { meta = {}, signedIn = false, permissions = [] } = options;
  const request = { headers: { cookie: "awtomatig.session_token=x" } } as unknown as AuthenticatedRequest;
  const handler = () => undefined;
  class Controller {}
  const context = {
    getHandler: () => handler,
    getClass: () => Controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  const reflector = new Reflector();
  jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => meta[key as string]);
  const getSession = jest
    .fn()
    .mockResolvedValue(signedIn ? { session: { id: "s1" }, user: { id: "u1", name: "Ada", email: "ada@example.com" } } : null);
  const grantsFor = jest.fn().mockResolvedValue({ roles: ["staff"], permissions });
  const guard = new AuthGuard(reflector, { getSession } as unknown as AuthService, { grantsFor } as unknown as RbacService);
  return { guard, context, request, getSession };
}

describe("AuthGuard", () => {
  it("lets a public endpoint through without looking up a session", async () => {
    const { guard, context, getSession } = setup({ meta: { [IS_PUBLIC]: true } });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(getSession).not.toHaveBeenCalled();
  });

  it("refuses a request with no session", async () => {
    const { guard, context } = setup();
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("attaches who is calling and what they may do", async () => {
    const { guard, context, request } = setup({ signedIn: true, permissions: ["crm.lead.read"] });
    await guard.canActivate(context);
    expect(request.auth).toEqual({
      userId: "u1",
      sessionId: "s1",
      name: "Ada",
      email: "ada@example.com",
      roles: ["staff"],
      permissions: ["crm.lead.read"],
    });
  });

  it("enforces the permission an endpoint declares", async () => {
    const meta = { [REQUIRED_PERMISSION]: "crm.lead.read" };
    const denied = setup({ signedIn: true, meta, permissions: ["inventory.stock.read"] });
    await expect(denied.guard.canActivate(denied.context)).rejects.toBeInstanceOf(ForbiddenError);

    const granted = setup({ signedIn: true, meta, permissions: ["crm.*"] });
    await expect(granted.guard.canActivate(granted.context)).resolves.toBe(true);
  });
});
