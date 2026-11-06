import { Inject, Injectable, Logger } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";

import { AppConfig } from "../config/app-config";
import { MailUnavailableError } from "./mail.errors";

export const MAIL_TRANSPORT = Symbol("MAIL_TRANSPORT");

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * The Gmail SMTP transport (an app password), same account type the website uses for its forms. In tests it is nodemailer's JSON
 * transport, which builds the message in memory and never opens a connection. Nothing connects at boot: the first send does.
 */
export function createMailTransport(config: Pick<AppConfig, "env">): Transporter {
  if (config.env.NODE_ENV === "test") return createTransport({ jsonTransport: true });
  return createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: config.env.SMTP_USER, pass: config.env.SMTP_PASS },
    // A stuck SMTP server must not hold a request or a process open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

/**
 * Sends the account emails (password changed, later: email change and password reset). Never logs an address, a link or a
 * message body: a failure is logged as the error's name and code only (for example `Error (EAUTH)` for a wrong app password).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly config: AppConfig,
    @Inject(MAIL_TRANSPORT) private readonly transport: Transporter,
  ) {}

  /** The sender line. `MAIL_FROM` if set, else the SMTP account. Gmail replaces the address part with the account's own anyway. */
  get sender(): string {
    const { MAIL_FROM, SMTP_USER } = this.config.env;
    return MAIL_FROM ?? `AWTOMATIG Admin <${SMTP_USER}>`;
  }

  /** Checks the SMTP login without sending anything (used by `npm run mail:check`). */
  async verify(): Promise<void> {
    try {
      await this.transport.verify();
    } catch (error) {
      this.logFailure(error);
      throw new MailUnavailableError();
    }
  }

  /** Sends one message and waits for the server to accept it. Throws `MailUnavailableError` when it cannot. */
  async send(message: MailMessage): Promise<void> {
    try {
      await this.transport.sendMail({ from: this.sender, ...message });
    } catch (error) {
      this.logFailure(error);
      throw new MailUnavailableError();
    }
  }

  /**
   * For a notice the caller does not wait for, and must not learn the outcome of (so a slow or failing mail server changes
   * neither the response nor its timing). The failure is already logged by `send`.
   */
  sendInBackground(message: MailMessage): void {
    void this.send(message).catch(() => undefined);
  }

  private logFailure(error: unknown): void {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "no code";
    this.logger.error(`Mail failed: ${error instanceof Error ? error.name : "unknown error"} (${code})`);
  }
}
