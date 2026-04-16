import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, "../dist/cli.js");

describe("end-to-end: init → check → status", () => {
  let projectDir: string;
  let configDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "omamori-e2e-"));
    configDir = mkdtempSync(join(tmpdir(), "omamori-e2e-config-"));
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        name: "e2e-test-app",
        dependencies: { commander: "^14.0.0" },
      }),
    );
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  });

  it("runs init, check, and status in sequence", () => {
    // 1. init
    const initOutput = execFileSync(
      "node",
      [cli, "init", "--dir", projectDir, "--config-dir", configDir],
      { encoding: "utf-8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
    );
    expect(initOutput).toContain("omamori.yaml");
    expect(initOutput).toContain(".omamori/graph.json");

    // 2. check
    const checkOutput = execFileSync(
      "node",
      [cli, "check", "--dir", projectDir],
      { encoding: "utf-8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
    );
    expect(checkOutput).toContain("🏥 e2e-test-app");
    expect(checkOutput).toContain("/100");

    // 3. status
    const statusOutput = execFileSync(
      "node",
      [cli, "status", "--config-dir", configDir],
      { encoding: "utf-8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
    );
    expect(statusOutput).toContain("📋 Portfolio Health");
    expect(statusOutput).toContain("e2e-test-app");
    expect(statusOutput).toContain("1 project tracked");
  });
});
