import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectApis } from "../../src/detectors/apis.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-apis-test-"));
}

function writePackageJson(dir: string, pkg: object): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
}

describe("detectApis", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects a single API (Stripe)", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { stripe: "^14.0.0" } });
    expect(detectApis(tempDir)).toEqual({ apis: ["stripe"] });
  });

  it("detects multiple APIs", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, {
      dependencies: {
        stripe: "^14.0.0",
        openai: "^4.0.0",
        "@anthropic-ai/sdk": "^0.9.0",
      },
    });
    const result = detectApis(tempDir);
    expect(result.apis).toContain("stripe");
    expect(result.apis).toContain("openai");
    expect(result.apis).toContain("anthropic");
    expect(result.apis).toHaveLength(3);
  });

  it("detects Sendgrid", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@sendgrid/mail": "^7.0.0" } });
    expect(detectApis(tempDir)).toEqual({ apis: ["sendgrid"] });
  });

  it("detects AWS SDKs", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, {
      dependencies: {
        "@aws-sdk/client-s3": "^3.0.0",
        "@aws-sdk/client-ses": "^3.0.0",
      },
    });
    const result = detectApis(tempDir);
    expect(result.apis).toContain("aws-s3");
    expect(result.apis).toContain("aws-ses");
  });

  it("detects Slack", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { "@slack/web-api": "^7.0.0" } });
    expect(detectApis(tempDir)).toEqual({ apis: ["slack"] });
  });

  it("returns empty array for unknown dependencies", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, { dependencies: { lodash: "^4.0.0" } });
    expect(detectApis(tempDir)).toEqual({ apis: [] });
  });

  it("returns empty array for missing package.json", () => {
    tempDir = makeTempDir();
    expect(detectApis(tempDir)).toEqual({ apis: [] });
  });

  it("checks both dependencies and devDependencies", () => {
    tempDir = makeTempDir();
    writePackageJson(tempDir, {
      dependencies: { stripe: "^14.0.0" },
      devDependencies: { twilio: "^4.0.0" },
    });
    const result = detectApis(tempDir);
    expect(result.apis).toContain("stripe");
    expect(result.apis).toContain("twilio");
  });
});
