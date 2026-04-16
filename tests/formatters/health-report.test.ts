import { describe, it, expect } from "vitest";
import { formatHealthReport } from "../../src/formatters/health-report.js";
import type { HealthReport } from "../../src/checks/types.js";

describe("formatHealthReport", () => {
  it("formats a complete health report", () => {
    const report: HealthReport = {
      projectName: "my-app",
      overallScore: 85,
      checks: [
        {
          dimension: "Dependencies",
          score: 74,
          label: "Dependencies",
          details: "2 packages behind latest",
          recommendations: ["Update react 17.0.0 → 18.3.0"],
          skipped: false,
        },
        {
          dimension: "Endpoints",
          score: 0,
          label: "Endpoints",
          details: "no deployed URL configured",
          recommendations: [],
          skipped: true,
        },
        {
          dimension: "Security",
          score: 100,
          label: "Security",
          details: "no known vulnerabilities",
          recommendations: [],
          skipped: false,
        },
      ],
    };

    const output = formatHealthReport(report);

    expect(output).toContain("🏥 my-app — Health: 85/100");
    expect(output).toContain("⚠ 74/100");
    expect(output).toContain("⊘ skipped");
    expect(output).toContain("✓ 100/100");
    expect(output).toContain("Recommended actions:");
    expect(output).toContain("1. Update react 17.0.0 → 18.3.0");
  });

  it("uses correct icons for score ranges", () => {
    const report: HealthReport = {
      projectName: "test",
      overallScore: 50,
      checks: [
        {
          dimension: "A",
          score: 90,
          label: "A",
          details: "good",
          recommendations: [],
          skipped: false,
        },
        {
          dimension: "B",
          score: 60,
          label: "B",
          details: "warning",
          recommendations: [],
          skipped: false,
        },
        {
          dimension: "C",
          score: 30,
          label: "C",
          details: "bad",
          recommendations: [],
          skipped: false,
        },
      ],
    };

    const output = formatHealthReport(report);
    expect(output).toContain("✓ 90/100");
    expect(output).toContain("⚠ 60/100");
    expect(output).toContain("✗ 30/100");
  });

  it("omits recommendations section when none exist", () => {
    const report: HealthReport = {
      projectName: "test",
      overallScore: 100,
      checks: [
        {
          dimension: "Security",
          score: 100,
          label: "Security",
          details: "all clear",
          recommendations: [],
          skipped: false,
        },
      ],
    };

    const output = formatHealthReport(report);
    expect(output).not.toContain("Recommended actions:");
  });
});
