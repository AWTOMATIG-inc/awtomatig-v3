import { Injectable, type OnModuleInit } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AppConfig } from "../config/app-config";
import { Database } from "../db/database";
import { MailService } from "../mail/mail.service";
import {
  emailChangeApprovalEmail,
  emailChangeConfirmEmail,
  emailChangedEmail,
  passwordChangedEmail,
  passwordResetEmail,
} from "../mail/templates";
import { type Auth, createAuth } from "./auth.factory";

/** Owns the one Better Auth instance. It is created on boot (so a bad config stops the app) and shared by the guard and the controllers. */
@Injectable()
export class AuthService implements OnModuleInit {
  private instance?: Promise<Auth>;

  constructor(
    private readonly config: AppConfig,
    private readonly database: Database,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  get(): Promise<Auth> {
    this.instance ??= createAuth({
      db: this.database.db,
      secret: this.config.env.BETTER_AUTH_SECRET,
      baseURL: this.config.env.BETTER_AUTH_URL,
      trustedOrigins: [this.config.env.BETTER_AUTH_URL, ...this.config.env.CORS_ORIGINS],
      rateLimit: this.config.env.NODE_ENV !== "test",
      audit: (entry) => this.audit.recordQuietly(entry),
      // In the background: a slow or failing mail server must not change the answer to the change-password request.
      onPasswordChanged: (user) =>
        this.mail.sendInBackground({ to: user.email, ...passwordChangedEmail({ name: user.name, changedAt: new Date() }) }),
      // The three email-change messages are also sent in the background, so Better Auth's answer (and its timing) is the same
      // whether or not the new address belongs to someone else.
      onEmailChangeRequested: ({ name, currentEmail, newEmail, link }) =>
        this.mail.sendInBackground({ to: currentEmail, ...emailChangeApprovalEmail({ name, newEmail, link }) }),
      onEmailChangeConfirmation: ({ name, newEmail, link }) =>
        this.mail.sendInBackground({ to: newEmail, ...emailChangeConfirmEmail({ name, link }) }),
      onEmailChanged: ({ name, previousEmail, newEmail }) =>
        this.mail.sendInBackground({ to: previousEmail, ...emailChangedEmail({ name, newEmail, changedAt: new Date() }) }),
      // Password reset: reset link sent in the background (uniform response time); notice sent after completion.
      onPasswordResetRequested: ({ name, email, link }) =>
        this.mail.sendInBackground({ to: email, ...passwordResetEmail({ name, link }) }),
      onPasswordResetCompleted: (user) =>
        this.mail.sendInBackground({ to: user.email, ...passwordChangedEmail({ name: user.name, changedAt: new Date() }) }),
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
