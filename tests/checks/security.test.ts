import { describe, it, expect } from "vitest";
import {
  parseAuditOutput,
  computeSecurityScore,
} from "../../src/checks/security.js";

describe("parseAuditOutput", () => {
  it("parses npm audit v2 format", () => {
    const output = JSON.stringify({
      vulnerabilities: {
        lodash: { severity: "high", via: [] },
        express: { severity: "moderate", via: [] },
        "node-fetch": { severity: "critical", via: [] },
      },
    });

    const counts = parseAuditOutput(output);
    expect(counts.critical).toBe(1);
    expect(counts.high).toBe(1);
    expect(counts.moderate).toBe(1);
    expect(counts.low).toBe(0);
  });

  it("parses npm audit v1 format", () => {
    const output = JSON.stringify({
      advisories: {
        "1": { severity: "low" },
        "2": { severity: "low" },
        "3": { severity: "high" },
      },
    });

    const counts = parseAuditOutput(output);
    expect(counts.low).toBe(2);
    expect(counts.high).toBe(1);
  });

  it("returns zeroes on invalid JSON", () => {
    const counts = parseAuditOutput("not json");
    expect(counts.critical).toBe(0);
    expect(counts.high).toBe(0);
    expect(counts.moderate).toBe(0);
    expect(counts.low).toBe(0);
  });

  it("returns zeroes on empty object", () => {
    const counts = parseAuditOutput("{}");
    expect(counts.critical).toBe(0);
  });
});

describe("computeSecurityScore", () => {
  it("returns 100 when no vulnerabilities", () => {
    expect(
      computeSecurityScore({ critical: 0, high: 0, moderate: 0, low: 0 }),
    ).toBe(100);
  });

  it("penalizes critical heavily", () => {
    expect(
      computeSecurityScore({ critical: 1, high: 0, moderate: 0, low: 0 }),
    ).toBe(75);
  });

  it("applies weighted penalties", () => {
    // 1 critical (25) + 2 high (30) + 1 moderate (5) = 60 penalty
    expect(
      computeSecurityScore({ critical: 1, high: 2, moderate: 1, low: 0 }),
    ).toBe(40);
  });

  it("floors at 0", () => {
    expect(
      computeSecurityScore({ critical: 5, high: 0, moderate: 0, low: 0 }),
    ).toBe(0);
  });
});
