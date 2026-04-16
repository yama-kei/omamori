import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectHosting } from "../../src/detectors/hosting.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-hosting-test-"));
}

describe("detectHosting", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects Vercel from vercel.json", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "vercel.json"), "{}");
    expect(detectHosting(tempDir)).toEqual({ hosting: "vercel" });
  });

  it("detects Netlify from netlify.toml", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "netlify.toml"), "");
    expect(detectHosting(tempDir)).toEqual({ hosting: "netlify" });
  });

  it("detects Cloudflare Workers from wrangler.toml", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "wrangler.toml"), "");
    expect(detectHosting(tempDir)).toEqual({ hosting: "cloudflare-workers" });
  });

  it("detects Fly.io from fly.toml", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "fly.toml"), "");
    expect(detectHosting(tempDir)).toEqual({ hosting: "fly" });
  });

  it("detects Render from render.yaml", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "render.yaml"), "");
    expect(detectHosting(tempDir)).toEqual({ hosting: "render" });
  });

  it("detects Railway from railway.json", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "railway.json"), "{}");
    expect(detectHosting(tempDir)).toEqual({ hosting: "railway" });
  });

  it("detects Docker from Dockerfile", () => {
    tempDir = makeTempDir();
    writeFileSync(join(tempDir, "Dockerfile"), "FROM node:18");
    expect(detectHosting(tempDir)).toEqual({ hosting: "docker" });
  });

  it("returns null when no config file found", () => {
    tempDir = makeTempDir();
    expect(detectHosting(tempDir)).toEqual({ hosting: null });
  });
});
