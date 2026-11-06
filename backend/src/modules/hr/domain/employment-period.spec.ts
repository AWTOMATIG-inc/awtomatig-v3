import { addDays, calculatePeriod, daysBetween, dhakaToday } from "./employment-period";

describe("calculatePeriod", () => {
  const period = (from: string, to: string) => {
    const { years, months, days } = calculatePeriod(from, to);
    return [years, months, days];
  };

  it("is zero on the joining day and before it", () => {
    expect(calculatePeriod("2026-11-01", "2026-11-01")).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
    expect(calculatePeriod("2026-11-10", "2026-11-01")).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
  });

  it("counts single days", () => {
    expect(period("2026-11-01", "2026-11-02")).toEqual([0, 0, 1]);
    expect(calculatePeriod("2026-11-01", "2026-11-02").totalDays).toBe(1);
  });

  it("counts exact months and years", () => {
    expect(period("2026-11-01", "2027-02-01")).toEqual([0, 3, 0]);
    expect(period("2025-11-06", "2026-11-06")).toEqual([1, 0, 0]);
    expect(period("2023-08-15", "2026-11-06")).toEqual([3, 2, 22]);
  });

  it("completes a month on the last day of a shorter month", () => {
    expect(period("2026-01-31", "2026-02-28")).toEqual([0, 1, 0]);
    expect(period("2026-01-31", "2026-03-01")).toEqual([0, 1, 1]);
    expect(period("2026-01-31", "2026-03-31")).toEqual([0, 2, 0]);
  });

  it("handles leap days", () => {
    expect(period("2024-02-29", "2025-02-28")).toEqual([1, 0, 0]);
    expect(period("2024-02-29", "2028-02-29")).toEqual([4, 0, 0]);
    expect(period("2024-02-28", "2024-03-01")).toEqual([0, 0, 2]);
    expect(calculatePeriod("2024-02-28", "2024-03-01").totalDays).toBe(2);
  });

  it("crosses a year end", () => {
    expect(period("2025-12-20", "2026-01-05")).toEqual([0, 0, 16]);
    expect(period("2025-12-31", "2026-01-31")).toEqual([0, 1, 0]);
  });

  it("reports the exact day count", () => {
    expect(calculatePeriod("2026-01-01", "2027-01-01").totalDays).toBe(365);
    expect(calculatePeriod("2024-01-01", "2025-01-01").totalDays).toBe(366);
  });
});

describe("date helpers", () => {
  it("adds and subtracts days across month and year ends", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-11-01", "2026-11-06")).toBe(5);
    expect(daysBetween("2026-11-06", "2026-11-01")).toBe(-5);
  });

  it("reads today in Dhaka, which is six hours ahead of UTC", () => {
    expect(dhakaToday(new Date("2026-11-05T17:59:00Z"))).toBe("2026-11-05");
    expect(dhakaToday(new Date("2026-11-05T18:00:00Z"))).toBe("2026-11-06");
  });
});
