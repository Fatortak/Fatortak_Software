import { describe, expect, it } from "vitest";
import { formatNumber, parseLocalDate } from "@/Helpers/localization";

describe("localization helpers", () => {
  it("parses a YYYY-MM-DD value as a local date", () => {
    const parsed = parseLocalDate("2026-11-01");
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(10);
    expect(parsed?.getDate()).toBe(1);
  });

  it("returns undefined for an empty date", () => {
    expect(parseLocalDate(undefined)).toBeUndefined();
    expect(parseLocalDate(null)).toBeUndefined();
    expect(parseLocalDate("")).toBeUndefined();
  });

  it("formats numeric values with grouping and two decimals", () => {
    expect(formatNumber(1234.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe(
      "1,234.50"
    );
  });

  it("returns the original text for non-numeric input", () => {
    expect(formatNumber("not-a-number")).toBe("not-a-number");
  });
});
