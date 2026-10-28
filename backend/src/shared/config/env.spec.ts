import { parseEnv } from "./env";

describe("parseEnv", () => {
  const valid = { DATABASE_URL: "postgres://user:pass@localhost:5432/db" };

  it("applies defaults", () => {
    const env = parseEnv(valid);
    expect(env).toMatchObject({
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: 4000,
      TRUST_PROXY: false,
      RATE_LIMIT_MAX: 120,
    });
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it("coerces numbers and splits the CORS list", () => {
    const env = parseEnv({ ...valid, PORT: "5000", CORS_ORIGINS: " http://a.test , http://b.test ,", TRUST_PROXY: "true" });
    expect(env.PORT).toBe(5000);
    expect(env.CORS_ORIGINS).toEqual(["http://a.test", "http://b.test"]);
    expect(env.TRUST_PROXY).toBe(true);
  });

  it("fails fast and lists every bad value", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://x", PORT: "99999" })).toThrow(/PORT[\s\S]*DATABASE_URL/);
  });

  it("requires DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });
});
