import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectUrl } from "../../src/detectors/url.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-url-test-"));
}

function writePackageJson(dir: string, pkg: object): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
}

describe("detectUrl", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects URL from package.json homepage", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { homepage: "https://myapp.vercel.app" });
    expect(detectUrl(tempDir)).toEqual({ url: "https://myapp.vercel.app" });
  });

  it("detects URL from CNAME file", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "CNAME"), "myapp.com\n");
    expect(detectUrl(tempDir)).toEqual({ url: "https://myapp.com" });
  });

  it("prefers homepage over CNAME", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { homepage: "https://myapp.vercel.app" });
    writeFileSync(join(tempDir, "CNAME"), "myapp.com\n");
    expect(detectUrl(tempDir)).toEqual({ url: "https://myapp.vercel.app" });
  });

  it("returns null when neither homepage nor CNAME exists", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { name: "my-app" });
    expect(detectUrl(tempDir)).toEqual({ url: null });
  });

  it("returns null for empty directory", () => {
    tempDir = makeTempDir();
    expect(detectUrl(tempDir)).toEqual({ url: null });
  });

  it("ignores homepage that does not start with http", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { homepage: "github.com/user/repo" });
    expect(detectUrl(tempDir)).toEqual({ url: null });
  });

  it("trims whitespace from CNAME", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "CNAME"), "  myapp.com  \n");
    expect(detectUrl(tempDir)).toEqual({ url: "https://myapp.com" });
  });
});
