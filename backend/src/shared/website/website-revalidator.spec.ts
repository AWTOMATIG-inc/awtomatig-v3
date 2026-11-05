import type { Env } from "../config/env";
import { WebsiteRevalidator } from "./website-revalidator";

const KEY = "test-ingest-key-test-ingest-key-0123456789";
const make = (websiteUrl?: string) => new WebsiteRevalidator({ env: { WEBSITE_URL: websiteUrl, LEAD_INGEST_KEY: KEY } as Env });

describe("WebsiteRevalidator", () => {
  afterEach(() => jest.restoreAllMocks());

  it("does nothing while WEBSITE_URL is not set", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    await make().caseStudiesChanged();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the website's refresh route with the shared key", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await make("http://127.0.0.1:3010/").caseStudiesChanged();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:3010/api/revalidate");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["x-ingest-key"]).toBe(KEY);
  });

  it("asks for the testimonials list when testimonials change", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await make("http://127.0.0.1:3010").testimonialsChanged();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:3010/api/revalidate?tag=testimonials");
    expect((init?.headers as Record<string, string>)["x-ingest-key"]).toBe(KEY);
  });

  it("does nothing for testimonials while WEBSITE_URL is not set", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    await make().testimonialsChanged();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when the website is down", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("connect ECONNREFUSED"));
    await expect(make("http://127.0.0.1:3010").caseStudiesChanged()).resolves.toBeUndefined();
  });

  it("never throws when the website refuses", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(make("http://127.0.0.1:3010").caseStudiesChanged()).resolves.toBeUndefined();
  });
});
