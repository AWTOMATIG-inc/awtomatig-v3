import { Injectable, type OnModuleInit } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AppConfig } from "../config/app-config";
import { Database } from "../db/database";
import { type Auth, createAuth } from "./auth.factory";

/** Owns the one Better Auth instance. It is created on boot (so a bad config stops the app) and shared by the guard and the controllers. */
@Injectable()
export class AuthService implements OnModuleInit {
  private instance?: Promise<Auth>;

  constructor(
    private readonly config: AppConfig,
    private readonly database: Database,
    private readonly audit: AuditService,
  ) {}

  get(): Promise<Auth> {
    this.instance ??= createAuth({
      db: this.database.db,
      secret: this.config.env.BETTER_AUTH_SECRET,
      baseURL: this.config.env.BETTER_AUTH_URL,
      trustedOrigins: [this.config.env.BETTER_AUTH_URL, ...this.config.env.CORS_ORIGINS],
      rateLimit: this.config.env.NODE_ENV !== "test",
      audit: (entry) => this.audit.recordQuietly(entry),
    });
    return this.instance;
  }

  async onModuleInit(): Promise<void> {
    await this.get();
  }

  /** The session behind the request's cookie, or null. Reads the database every time, so a revoked session stops working at once. */
  async getSession(headers: Headers) {
    return (await this.get()).api.getSession({ headers });
  }

  async handle(request: Request): Promise<Response> {
    return (await this.get()).handler(request);
  }
}
