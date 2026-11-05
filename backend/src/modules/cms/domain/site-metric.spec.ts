import { findSiteMetric, SITE_METRIC_KEYS, SITE_METRICS, valueProblem } from "./site-metric";

describe("site metric catalog", () => {
  it("has unique keys, and every slot says where it appears", () => {
    expect(new Set(SITE_METRIC_KEYS).size).toBe(SITE_METRICS.length);
    for (const metric of SITE_METRICS) {
      expect(metric.title.length).toBeGreaterThan(0);
      expect(metric.placements.length).toBeGreaterThan(0);
      for (const placement of metric.placements) {
        expect(placement.page).not.toBe("");
        expect(placement.route.startsWith("/")).toBe(true);
        expect(placement.section).not.toBe("");
      }
    }
  });

  it("starts every slot at a value that passes its own format", () => {
    for (const metric of SITE_METRICS) expect(valueProblem(metric.kind, metric.defaultValue)).toBeNull();
  });

  it("uses one value for a figure shown on several pages", () => {
    expect(findSiteMetric("systems_delivered")?.placements.map((placement) => placement.page)).toEqual([
      "Contact",
      "Cleaning landing page",
      "Home",
    ]);
    expect(findSiteMetric("systems_delivered")?.defaultValue).toBe("25+");
    expect(findSiteMetric("client_retention")?.defaultValue).toBe("95%");
  });
});

describe("valueProblem", () => {
  it.each(["5", "5+", "95%", "120+", "12k", "2M+", "99999"])("accepts the stat %s", (value) => {
    expect(valueProblem("stat", value)).toBeNull();
  });

  it.each(["", "lots", "4.5+", "+5", "5 +", "100000", "5++", "-3", "1e3"])("refuses the stat %j", (value) => {
    expect(valueProblem("stat", value)).not.toBeNull();
  });

  it.each(["0", "4", "4.8", "5", "5.0", "0.5"])("accepts the rating %s", (value) => {
    expect(valueProblem("rating", value)).toBeNull();
  });

  it.each(["", "5.1", "6", "4.85", "-1", "4,8", "five", "4.8+"])("refuses the rating %j", (value) => {
    expect(valueProblem("rating", value)).not.toBeNull();
  });
});
