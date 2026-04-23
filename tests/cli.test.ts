import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, "../dist/cli.js");

function run(...args: string[]): string {
  return execFileSync("node", [cli, ...args], {
    encoding: "utf-8",
  }).trim();
}

describe("omamori CLI", () => {
  it("shows help with --help", () => {
    const output = run("--help");
    expect(output).toContain("omamori");
    expect(output).toContain("init");
    expect(output).toContain("check");
    expect(output).toContain("status");
  });

  it("shows version with --version", () => {
    const output = run("--version");
    expect(output).toBe("0.1.0");
  });

  it("check errors without omamori.yaml", () => {
    try {
      run("check", "--dir", "/tmp/nonexistent-dir-for-test");
      expect.unreachable("should have thrown");
    } catch (err) {
      const stderr = (err as { stderr: string }).stderr;
      expect(stderr).toContain("omamori.yaml not found");
    }
  });

  it("status shows empty portfolio message when no projects", () => {
    const output = run("status", "--config-dir", "/tmp/nonexistent-config-dir");
    expect(output).toContain("No projects onboarded");
  });
});

describe("omamori init", () => {
  let dir: string;
  let configDir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "omamori-cli-test-"));
    configDir = mkdtempSync(join(tmpdir(), "omamori-cli-config-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  });

  it("runs init and creates omamori.yaml", () => {
    const output = execFileSync(
      "node",
      [cli, "init", "--dir", dir, "--config-dir", configDir],
      {
        encoding: "utf-8",
        env: { ...process.env, ANTHROPIC_API_KEY: "" },
      },
    );
    expect(output).toContain("omamori.yaml");
  });
});
