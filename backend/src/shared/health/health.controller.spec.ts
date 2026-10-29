import { APP_INTERCEPTOR } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { ZodSerializerInterceptor } from "nestjs-zod";

import { Database } from "../db/database";
import { HealthController } from "./health.controller";

// The success path needs a database that answers. A fake one keeps this test independent of PostgreSQL.
describe("HealthController with a working database", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: Database, useValue: { db: { execute: () => Promise.resolve([]) } } },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health reports the database as up with uptime and a timestamp", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    const body = response.json<{ status: string; database: string; uptimeSeconds: number; timestamp: string }>();
    expect(body).toMatchObject({ status: "ok", database: "up" });
    expect(Number.isInteger(body.uptimeSeconds)).toBe(true);
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("GET /health/ready answers ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
