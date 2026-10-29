import { All, Controller, Get, Req, Res } from "@nestjs/common";
import { ApiExcludeController, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { createZodDto, ZodSerializerDto } from "nestjs-zod";
import { z } from "zod";

import { type AuthContext, CurrentAuth, Public } from "./auth.decorators";
import { toHeaders } from "./auth.http";
import { AuthService } from "./auth.service";

/**
 * Better Auth's own endpoints (sign-in, sign-out, change password) under /api/v1/auth/*. Better Auth does its own
 * authentication, origin check and rate limiting, so the global guard skips them. They are not in openapi.json: the admin
 * talks to them through Better Auth's client.
 */
@ApiExcludeController()
@Public()
@Controller("auth")
export class AuthHandlerController {
  constructor(private readonly auth: AuthService) {}

  @All("*")
  async handle(@Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const headers = toHeaders(request.headers);
    // The address Fastify resolved (honouring TRUST_PROXY), so a client cannot choose its own rate-limit bucket.
    headers.set("x-forwarded-for", request.ip);
    headers.delete("content-length");

    const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.body !== undefined && request.body !== null;
    const response = await this.auth.handle(
      new Request(new URL(request.url, `${request.protocol}://${request.hostname}`), {
        method: request.method,
        headers,
        body: hasBody ? JSON.stringify(request.body) : undefined,
      }),
    );

    void reply.status(response.status);
    for (const cookie of response.headers.getSetCookie()) void reply.header("set-cookie", cookie);
    response.headers.forEach((value, name) => {
      if (name !== "set-cookie") void reply.header(name, value);
    });
    void reply.send(await response.text());
  }
}

class SessionDto extends createZodDto(
  z.object({
    user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
) {}

@ApiTags("auth")
@Controller("auth")
export class SessionController {
  /**
   * Who the signed-in employee is and what they may do. The admin app calls this on every page load. It answers 401 without
   * a session.
   */
  @Get("session")
  @ZodSerializerDto(SessionDto)
  @ApiOkResponse({ type: SessionDto })
  @ApiUnauthorizedResponse({ description: "No valid session" })
  session(@CurrentAuth() auth: AuthContext) {
    return {
      user: { id: auth.userId, name: auth.name, email: auth.email },
      roles: auth.roles,
      permissions: auth.permissions,
    };
  }
}
