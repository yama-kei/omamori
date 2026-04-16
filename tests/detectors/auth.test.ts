import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectAuth } from "../../src/detectors/auth.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-auth-test-"));
}

function writePackageJson(dir: string, pkg: object): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
}

describe("detectAuth", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects NextAuth", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "next-auth": "^4.0.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "next-auth" });
  });

  it("detects Clerk via @clerk/nextjs", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@clerk/nextjs": "^4.0.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "clerk" });
  });

  it("detects Clerk via @clerk/clerk-react", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@clerk/clerk-react": "^4.0.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "clerk" });
  });

  it("detects Supabase Auth via @supabase/auth-helpers-nextjs (regex)", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@supabase/auth-helpers-nextjs": "^0.8.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "supabase-auth" });
  });

  it("detects Supabase Auth via @supabase/ssr", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@supabase/ssr": "^0.1.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "supabase-auth" });
  });

  it("detects Auth0 via @auth0/nextjs-auth0", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@auth0/nextjs-auth0": "^3.0.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "auth0" });
  });

  it("detects Auth0 via @auth0/auth0-react", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@auth0/auth0-react": "^2.0.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "auth0" });
  });

  it("detects Firebase Auth via firebase-admin", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "firebase-admin": "^11.0.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "firebase-auth" });
  });

  it("detects Lucia", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@lucia-auth/core": "^2.0.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: "lucia" });
  });

  it("returns null for unknown dependencies", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { passport: "^0.6.0" } });
    expect(detectAuth(tempDir)).toEqual({ auth: null });
  });

  it("returns null for missing package.json", () => {
    tempDir = makeTempDir();
    expect(detectAuth(tempDir)).toEqual({ auth: null });
  });
});
