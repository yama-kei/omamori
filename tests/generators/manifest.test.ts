import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as yamlParse } from "yaml";
import type { DetectionResult, IntentResult } from "../../src/detectors/types.js";
import { generateManifest } from "../../src/generators/manifest.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-manifest-test-"));
}

function makeDetectionResult(overrides: Partial<DetectionResult> = {}): DetectionResult {
  return {
    framework: { framework: null, version: null },
    hosting: { hosting: null },
    database: { database: null },
    apis: { apis: [] },
    auth: { auth: null },
    env: { envVars: [] },
    url: { url: null },
    ...overrides,
  };
}

const sampleIntent: IntentResult = {
  description: "A SaaS app for managing subscriptions",
  goals: ["Provide subscription management", "Send invoices automatically"],
  non_goals: ["Build a payment processor"],
  invariants: ["All payments must be logged"],
  trust_boundaries: ["External payment APIs are untrusted"],
};

describe("generateManifest", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("generates a manifest with detection results and LLM intent", () => {
    tempDir = makeTempDir();

    const detection = makeDetectionResult({
      framework: { framework: "nextjs", version: "14.0.0" },
      hosting: { hosting: "vercel" },
      database: { database: "supabase" },
      auth: { auth: "next-auth" },
      apis: { apis: ["stripe"] },
      env: { envVars: ["STRIPE_SECRET_KEY", "DATABASE_URL"] },
      url: { url: "https://my-app.vercel.app" },
    });

    generateManifest(tempDir, "my-app", detection, sampleIntent);

    const manifestPath = join(tempDir, "omamori.yaml");
    const raw = readFileSync(manifestPath, "utf-8");
    const manifest = yamlParse(raw) as Record<string, unknown>;

    expect(manifest.name).toBe("my-app");
    expect(manifest.description).toBe("A SaaS app for managing subscriptions");
    expect(manifest.goals).toEqual(["Provide subscription management", "Send invoices automatically"]);
    expect(manifest.non_goals).toEqual(["Build a payment processor"]);
    expect(manifest.invariants).toEqual(["All payments must be logged"]);
    expect(manifest.trust_boundaries).toEqual(["External payment APIs are untrusted"]);

    const infrastructure = manifest.infrastructure as Record<string, unknown>;
    expect(infrastructure.hosting).toBe("vercel");
    expect(infrastructure.database).toBe("supabase");
    expect(infrastructure.apis).toEqual(["stripe"]);

    const costBudget = manifest.cost_budget as Record<string, unknown>;
    expect(costBudget.monthly_max).toBeNull();
    expect(costBudget.alert_at).toBeNull();

    const healthThresholds = manifest.health_thresholds as Record<string, unknown>;
    expect(healthThresholds.dependency_staleness).toBe("90 days");
    expect(healthThresholds.uptime).toBe("99%");
    expect(healthThresholds.response_time_p95).toBe("2s");
  });

  it("generates a manifest with placeholder values when intent is null", () => {
    tempDir = makeTempDir();

    const detection = makeDetectionResult();
    generateManifest(tempDir, "my-app", detection, null);

    const manifestPath = join(tempDir, "omamori.yaml");
    const raw = readFileSync(manifestPath, "utf-8");
    const manifest = yamlParse(raw) as Record<string, unknown>;

    expect(manifest.description).toBe("TODO: Add project description");
    expect(Array.isArray(manifest.goals)).toBe(true);
    expect((manifest.goals as string[])[0]).toContain("TODO");
    expect(Array.isArray(manifest.non_goals)).toBe(true);
    expect(Array.isArray(manifest.invariants)).toBe(true);
    expect(Array.isArray(manifest.trust_boundaries)).toBe(true);
  });

  it("sets infrastructure.repo to null for a temp dir (no git remote)", () => {
    tempDir = makeTempDir();

    const detection = makeDetectionResult();
    generateManifest(tempDir, "my-app", detection, null);

    const manifestPath = join(tempDir, "omamori.yaml");
    const raw = readFileSync(manifestPath, "utf-8");
    const manifest = yamlParse(raw) as Record<string, unknown>;

    const infrastructure = manifest.infrastructure as Record<string, unknown>;
    expect(infrastructure.repo).toBeNull();
  });
});
