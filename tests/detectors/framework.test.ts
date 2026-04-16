import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectFramework } from "../../src/detectors/framework.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-framework-test-"));
}

function writePackageJson(dir: string, pkg: object): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
}

describe("detectFramework", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects Next.js from dependencies", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { next: "^13.5.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: "nextjs", version: "13.5.0" });
  });

  it("detects Next.js from devDependencies", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { devDependencies: { next: "~14.0.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: "nextjs", version: "14.0.0" });
  });

  it("detects Astro", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { astro: "^3.0.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: "astro", version: "3.0.0" });
  });

  it("detects React Native", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "react-native": "0.72.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: "react-native", version: "0.72.0" });
  });

  it("detects Expo (takes priority over react-native)", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { expo: "~49.0.0", "react-native": "0.72.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: "expo", version: "49.0.0" });
  });

  it("detects Nuxt", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { nuxt: "^3.8.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: "nuxt", version: "3.8.0" });
  });

  it("detects SvelteKit (takes priority over svelte)", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { devDependencies: { "@sveltejs/kit": "^1.0.0", svelte: "^4.0.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: "sveltekit", version: "1.0.0" });
  });

  it("returns null for unknown dependencies", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { lodash: "^4.0.0" } });
    expect(detectFramework(tempDir)).toEqual({ framework: null, version: null });
  });

  it("returns null for missing package.json", () => {
    tempDir = makeTempDir();
    expect(detectFramework(tempDir)).toEqual({ framework: null, version: null });
  });
});
