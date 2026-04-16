import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectDatabase } from "../../src/detectors/database.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-database-test-"));
}

function writePackageJson(dir: string, pkg: object): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
}

describe("detectDatabase", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects Supabase", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@supabase/supabase-js": "^2.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "supabase" });
  });

  it("detects Prisma", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@prisma/client": "^5.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "prisma" });
  });

  it("detects Drizzle", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "drizzle-orm": "^0.28.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "drizzle" });
  });

  it("detects MongoDB via mongoose", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { mongoose: "^7.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "mongodb" });
  });

  it("detects Firebase", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { firebase: "^10.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "firebase" });
  });

  it("detects PostgreSQL via pg", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { pg: "^8.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "postgresql" });
  });

  it("detects MySQL via mysql2", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { mysql2: "^3.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "mysql" });
  });

  it("detects SQLite via better-sqlite3", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "better-sqlite3": "^9.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: "sqlite" });
  });

  it("returns null for unknown dependencies", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { axios: "^1.0.0" } });
    expect(detectDatabase(tempDir)).toEqual({ database: null });
  });

  it("returns null for missing package.json", () => {
    tempDir = makeTempDir();
    expect(detectDatabase(tempDir)).toEqual({ database: null });
  });
});
