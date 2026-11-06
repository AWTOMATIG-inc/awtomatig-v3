import { Logger } from "@nestjs/common";
import type { Transporter } from "nodemailer";

import type { Env } from "../config/env";
import { MailUnavailableError } from "./mail.errors";
import { createMailTransport, MailService } from "./mail.service";

const baseEnv = { NODE_ENV: "test", SMTP_USER: "sender@example.com", SMTP_PASS: "app password" } as Env;
const message = { to: "person@example.com", subject: "Subject", text: "Text", html: "<p>Html</p>" };

function setup(transport: Partial<Transporter>, env: Partial<Env> = {}) {
  return new MailService({ env: { ...baseEnv, ...env } }, transport as Transporter);
}

describe("MailService", () => {
  afterEach(() => jest.restoreAllMocks());

  it("sends from the SMTP account by default and from MAIL_FROM when it is set", async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    await setup({ sendMail }).send(message);
    expect(sendMail).toHaveBeenCalledWith({ from: "AWTOMATIG Admin <sender@example.com>", ...message });

    sendMail.mockClear();
    await setup({ sendMail }, { MAIL_FROM: "Team <team@example.com>" }).send(message);
    expect(sendMail).toHaveBeenCalledWith({ from: "Team <team@example.com>", ...message });
  });

  it("turns a failure into MailUnavailableError and logs only the error name and code", async () => {
    const logged: string[] = [];
    jest.spyOn(Logger.prototype, "error").mockImplementation((text: unknown) => void logged.push(String(text)));
    const failure = Object.assign(new Error("535 login failed for person@example.com with app password"), { code: "EAUTH" });
    const mail = setup({ sendMail: jest.fn().mockRejectedValue(failure) });

    await expect(mail.send(message)).rejects.toBeInstanceOf(MailUnavailableError);
    expect(logged).toEqual(["Mail failed: Error (EAUTH)"]);
  });

  it("verifies the login without sending, and reports a failure the same way", async () => {
    const verify = jest.fn().mockResolvedValue(true);
    await setup({ verify }).verify();
    expect(verify).toHaveBeenCalled();

    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    await expect(setup({ verify: jest.fn().mockRejectedValue(new Error("nope")) }).verify()).rejects.toBeInstanceOf(
      MailUnavailableError,
    );
  });

  it("sends in the background without ever throwing or rejecting", async () => {
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const sendMail = jest.fn().mockRejectedValue(new Error("down"));
    const mail = setup({ sendMail });

    expect(() => mail.sendInBackground(message)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it("uses an in-memory transport in tests, so nothing opens a connection", async () => {
    const info = (await createMailTransport({ env: baseEnv }).sendMail({ from: "a@example.com", ...message })) as {
      message: string;
    };
    expect(JSON.parse(info.message)).toMatchObject({ subject: "Subject", to: [{ address: "person@example.com" }] });
  });
});
