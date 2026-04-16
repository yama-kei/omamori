import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as yamlStringify } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, "../dist/cli.js");

describe("omamori status (integration)", () => {
  let configDir: string;

  beforeEach(() => {
    configDir = mkdtempSync(join(tmpdir(), "omamori-status-config-"));
  });

  afterEach(() => {
    rmSync(configDir, { recursive: true, force: true });
  });

  it("shows empty message when no projects registered", () => {
    const output = execFileSync(
      "node",
      [cli, "status", "--config-dir", configDir],
      { encoding: "utf-8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
    );

    expect(output).toContain("No projects onboarded");
    expect(output).toContain("omamori init");
  });

  it("shows error for missing project directory", () => {
    writeFileSync(
      join(configDir, "projects.json"),
      JSON.stringify([
        { name: "ghost", path: "/tmp/nonexistent-project-dir", onboardedAt: new Date().toISOString() },
      ]),
    );

    const output = execFileSync(
      "node",
      [cli, "status", "--config-dir", configDir],
      { encoding: "utf-8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
    );

    expect(output).toContain("📋 Portfolio Health");
    expect(output).toContain("ghost");
    expect(output).toContain("✗ project directory not found");
    expect(output).toContain("1 project tracked");
  });

  it("shows health report for an onboarded project", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "omamori-status-project-"));

    writeFileSync(
      join(projectDir, "omamori.yaml"),
      yamlStringify({
        name: "test-app",
        description: "Test",
        goals: [],
        infrastructure: { repo: null, hosting: null, database: null, apis: [] },
        cost_budget: { monthly_max: null, alert_at: null },
        health_thresholds: { dependency_staleness: "90 days", uptime: "99%", response_time_p95: "2s" },
      }),
    );

    mkdirSync(join(projectDir, ".omamori"), { recursive: true });
    writeFileSync(
      join(projectDir, ".omamori", "graph.json"),
      JSON.stringify({
        files: [],
        dependencies: [],
        externalApis: [],
        envVars: [],
        infrastructure: { framework: null, hosting: null, database: null, auth: null },
      }),
    );

    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ name: "test-app", dependencies: {} }),
    );

    writeFileSync(
      join(configDir, "projects.json"),
      JSON.stringify([
        { name: "test-app", path: projectDir, onboardedAt: new Date().toISOString() },
      ]),
    );

    const output = execFileSync(
      "node",
      [cli, "status", "--config-dir", configDir],
      { encoding: "utf-8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
    );

    expect(output).toContain("📋 Portfolio Health");
    expect(output).toContain("test-app");
    expect(output).toContain("/100");
    expect(output).toContain("1 project tracked");

    rmSync(projectDir, { recursive: true, force: true });
  });
});
