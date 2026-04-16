import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectEnvVars } from "../../src/detectors/env.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-env-test-"));
}

describe("detectEnvVars", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects env vars from .env.example", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, ".env.example"), "DATABASE_URL=postgres://...\nAPI_KEY=your-key\n");
    const result = detectEnvVars(tempDir);
    expect(result.envVars).toContain("DATABASE_URL");
    expect(result.envVars).toContain("API_KEY");
  });

  it("detects env vars from .env.local.example", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, ".env.local.example"), "NEXT_PUBLIC_URL=https://example.com\n");
    expect(detectEnvVars(tempDir)).toEqual({ envVars: ["NEXT_PUBLIC_URL"] });
  });

  it("detects env vars from .env.sample", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, ".env.sample"), "SECRET_KEY=abc123\n");
    expect(detectEnvVars(tempDir)).toEqual({ envVars: ["SECRET_KEY"] });
  });

  it("ignores comments and empty lines", () => {
    tempDir = makeTempDir();
    writeFileSync(
      join(tempDir, ".env.example"),
      "# This is a comment\n\nDATABASE_URL=postgres://...\n# Another comment\n\nAPI_SECRET=secret\n"
    );
    expect(detectEnvVars(tempDir)).toEqual({ envVars: ["API_SECRET", "DATABASE_URL"] });
  });

  it("deduplicates across files", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, ".env.example"), "DATABASE_URL=x\nAPI_KEY=y\n");
    writeFileSync(join(tempDir, ".env.local.example"), "DATABASE_URL=z\nNEW_VAR=w\n");
    const result = detectEnvVars(tempDir);
    const dbUrlCount = result.envVars.filter((v) => v === "DATABASE_URL").length;
    expect(dbUrlCount).toBe(1);
    expect(result.envVars).toContain("API_KEY");
    expect(result.envVars).toContain("NEW_VAR");
  });

  it("sorts alphabetically", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, ".env.example"), "ZEBRA=1\nAPPLE=2\nMIDDLE=3\n");
    expect(detectEnvVars(tempDir)).toEqual({ envVars: ["APPLE", "MIDDLE", "ZEBRA"] });
  });

  it("returns empty array when no env files exist", () => {
    tempDir = makeTempDir();
    expect(detectEnvVars(tempDir)).toEqual({ envVars: [] });
  });

  it("ignores lowercase variable names", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, ".env.example"), "VALID_VAR=x\nlower_case=y\n");
    expect(detectEnvVars(tempDir)).toEqual({ envVars: ["VALID_VAR"] });
  });
});
