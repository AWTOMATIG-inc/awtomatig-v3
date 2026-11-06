import { createHmac } from "node:crypto";

import { readSignedToken } from "./signed-token";

/** Signs a token the way Better Auth does (HS256 JWT). */
function signTokenForTest(payload: Record<string, unknown>, secret: string): string {
  const b64 = (data: Buffer | string) => Buffer.from(data).toString("base64url");
  const header = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64(JSON.stringify(payload));
  return `${header}.${body}.${b64(createHmac("sha256", secret).update(`${header}.${body}`).digest())}`;
}

describe("readSignedToken", () => {
  const secret = "a-test-secret-that-is-long-enough-0123456789";
  const now = new Date("2026-11-06T08:00:00Z");
  const exp = Math.floor(now.getTime() / 1000) + 3600;

  it("reads a token signed with the secret", () => {
    const token = signTokenForTest({ email: "a@test.invalid", updateTo: "b@test.invalid", exp }, secret);
    expect(readSignedToken(token, secret, now)).toMatchObject({ email: "a@test.invalid", updateTo: "b@test.invalid" });
  });

  it("refuses a wrong secret, a changed payload, an expired token and rubbish", () => {
    const token = signTokenForTest({ email: "a@test.invalid", exp }, secret);
    expect(readSignedToken(token, "another-secret-another-secret-123456", now)).toBeNull();

    const [head, , sig] = token.split(".") as [string, string, string];
    const forged = Buffer.from(JSON.stringify({ email: "x@test.invalid", exp })).toString("base64url");
    expect(readSignedToken(`${head}.${forged}.${sig}`, secret, now)).toBeNull();

    expect(readSignedToken(token, secret, new Date(now.getTime() + 2 * 3600 * 1000))).toBeNull();
    expect(readSignedToken("not a token", secret, now)).toBeNull();
    expect(readSignedToken("a.b.c", secret, now)).toBeNull();
  });

  it("refuses a token that names another algorithm", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ email: "a@test.invalid", exp })).toString("base64url");
    expect(readSignedToken(`${header}.${body}.`, secret, now)).toBeNull();
  });
});
