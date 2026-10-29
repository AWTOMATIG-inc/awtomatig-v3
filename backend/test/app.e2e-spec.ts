import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import { createApp } from "../src/bootstrap";

describe("API shell", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    process.env.RATE_LIMIT_MAX = "1000";
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers the liveness check without touching the database", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/health/live" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("reports 503 in the single error shape when PostgreSQL is unreachable", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/health/ready" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ code: "SERVICE_UNAVAILABLE", message: "The database is not reachable" });
  });

  it("reports 503 from the details endpoint too when PostgreSQL is unreachable", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ code: "SERVICE_UNAVAILABLE", message: "The database is not reachable" });
  });

  it("returns an unknown route as the single error shape", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/nope" });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "NOT_FOUND" });
  });

  it("sets security headers and only allows configured CORS origins", async () => {
    const allowed = await app.inject({ method: "GET", url: "/api/v1/health/live", headers: { origin: "http://localhost:3000" } });
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(allowed.headers["x-content-type-options"]).toBe("nosniff");

    const denied = await app.inject({ method: "GET", url: "/api/v1/health/live", headers: { origin: "http://evil.test" } });
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("rate limiting", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    process.env.RATE_LIMIT_MAX = "2";
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers with 429 and the single error shape after the limit", async () => {
    await app.inject({ method: "GET", url: "/api/v1/health/live" });
    await app.inject({ method: "GET", url: "/api/v1/health/live" });
    const response = await app.inject({ method: "GET", url: "/api/v1/health/live" });
    expect(response.statusCode).toBe(429);
    expect(response.json()).toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
