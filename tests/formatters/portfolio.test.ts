import { describe, it, expect } from "vitest";
import { formatPortfolio, type ProjectStatus } from "../../src/formatters/portfolio.js";
import type { HealthReport } from "../../src/checks/types.js";

function makeReport(overrides: Partial<HealthReport> = {}): HealthReport {
  return {
    projectName: "test",
    overallScore: 85,
    checks: [
      {
        dimension: "Dependencies",
        score: 85,
        label: "Dependencies",
        details: "all up to date",
        recommendations: [],
        skipped: false,
      },
    ],
    ...overrides,
  };
}

describe("formatPortfolio", () => {
  it("shows empty message when no projects", () => {
    const output = formatPortfolio([]);
    expect(output).toContain("No projects onboarded");
    expect(output).toContain("omamori init");
  });

  it("formats a single healthy project", () => {
    const projects: ProjectStatus[] = [
      { name: "my-app", path: "/home/user/my-app", report: makeReport(), error: null },
    ];

    const output = formatPortfolio(projects);
    expect(output).toContain("📋 Portfolio Health");
    expect(output).toContain("my-app");
    expect(output).toContain("85/100");
    expect(output).toContain("✓ healthy");
    expect(output).toContain("1 project tracked");
  });

  it("formats multiple projects with different scores", () => {
    const projects: ProjectStatus[] = [
      {
        name: "app-a",
        path: "/a",
        report: makeReport({ overallScore: 92, checks: [
          { dimension: "D", score: 92, label: "D", details: "good", recommendations: [], skipped: false },
        ]}),
        error: null,
      },
      {
        name: "app-b",
        path: "/b",
        report: makeReport({ overallScore: 60, checks: [
          { dimension: "D", score: 60, label: "D", details: "3 stale deps", recommendations: [], skipped: false },
        ]}),
        error: null,
      },
    ];

    const output = formatPortfolio(projects);
    expect(output).toContain("✓ healthy");
    expect(output).toContain("⚠ 3 stale deps");
    expect(output).toContain("2 projects tracked");
  });

  it("shows error for missing directory", () => {
    const projects: ProjectStatus[] = [
      {
        name: "gone",
        path: "/nonexistent",
        report: null,
        error: "project directory not found (/nonexistent)",
      },
    ];

    const output = formatPortfolio(projects);
    expect(output).toContain("✗ project directory not found");
    expect(output).toContain("1 project tracked");
  });

  it("uses ✗ icon for scores below 50", () => {
    const projects: ProjectStatus[] = [
      {
        name: "bad",
        path: "/bad",
        report: makeReport({ overallScore: 30, checks: [
          { dimension: "S", score: 30, label: "S", details: "5 critical vulns", recommendations: [], skipped: false },
        ]}),
        error: null,
      },
    ];

    const output = formatPortfolio(projects);
    expect(output).toContain("✗ 5 critical vulns");
  });

  it("handles project with no non-skipped checks", () => {
    const projects: ProjectStatus[] = [
      {
        name: "empty",
        path: "/empty",
        report: makeReport({ overallScore: 0, checks: [
          { dimension: "D", score: 0, label: "D", details: "skipped", recommendations: [], skipped: true },
        ]}),
        error: null,
      },
    ];

    const output = formatPortfolio(projects);
    expect(output).toContain("no checks ran");
  });
});
