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

describe("omamori check (integration)", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "omamori-check-test-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("errors when omamori.yaml is missing", () => {
    try {
      execFileSync("node", [cli, "check", "--dir", projectDir], {
        encoding: "utf-8",
        env: { ...process.env, ANTHROPIC_API_KEY: "" },
      });
      expect.unreachable("should have thrown");
    } catch (err) {
      const stderr = (err as { stderr: string }).stderr;
      expect(stderr).toContain("omamori.yaml not found");
      expect(stderr).toContain("omamori init");
    }
  });

  it("errors when graph.json is missing", () => {
    writeFileSync(
      join(projectDir, "omamori.yaml"),
      yamlStringify({ name: "test-app" }),
    );

    try {
      execFileSync("node", [cli, "check", "--dir", projectDir], {
        encoding: "utf-8",
        env: { ...process.env, ANTHROPIC_API_KEY: "" },
      });
      expect.unreachable("should have thrown");
    } catch (err) {
      const stderr = (err as { stderr: string }).stderr;
      expect(stderr).toContain("graph.json not found");
    }
  });

  it("produces a health report for an onboarded project", () => {
    const manifest = {
      name: "test-app",
      description: "Test application",
      goals: ["Goal 1"],
      non_goals: ["Non-goal 1"],
      invariants: ["Invariant 1"],
      trust_boundaries: ["Boundary 1"],
      infrastructure: {
        repo: null,
        hosting: null,
        database: null,
        apis: [],
      },
      cost_budget: { monthly_max: null, alert_at: null },
      health_thresholds: {
        dependency_staleness: "90 days",
        uptime: "99%",
        response_time_p95: "2s",
      },
    };

    const graph = {
      files: [],
      dependencies: [],
      externalApis: [],
      envVars: [],
      infrastructure: {
        framework: null,
        hosting: null,
        database: null,
        auth: null,
      },
    };

    writeFileSync(join(projectDir, "omamori.yaml"), yamlStringify(manifest));
    mkdirSync(join(projectDir, ".omamori"), { recursive: true });
    writeFileSync(
      join(projectDir, ".omamori", "graph.json"),
      JSON.stringify(graph, null, 2),
    );

    // Also need package.json for npm audit
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ name: "test-app", dependencies: {} }),
    );

    const output = execFileSync("node", [cli, "check", "--dir", projectDir], {
      encoding: "utf-8",
      env: { ...process.env, ANTHROPIC_API_KEY: "" },
    });

    expect(output).toContain("🏥 test-app");
    expect(output).toContain("Health:");
    expect(output).toContain("/100");
    expect(output).toContain("Dependencies");
    expect(output).toContain("Security");
  });
});
