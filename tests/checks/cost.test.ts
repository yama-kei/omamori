import { describe, it, expect } from "vitest";
import { checkCost } from "../../src/checks/cost.js";
import type { ManifestData } from "../../src/checks/types.js";

function makeManifest(overrides: Partial<ManifestData> = {}): ManifestData {
  return {
    name: "test-app",
    infrastructure: { hosting: null, database: null, apis: [] },
    cost_budget: { monthly_max: null, alert_at: null },
    ...overrides,
  };
}

describe("checkCost", () => {
  it("skips when no budget configured", () => {
    const result = checkCost(makeManifest());
    expect(result.skipped).toBe(true);
    expect(result.details).toContain("no budget");
  });

  it("returns high score when budget set and no concerns", () => {
    const result = checkCost(
      makeManifest({
        cost_budget: { monthly_max: "10 USD", alert_at: "7 USD" },
      }),
    );
    expect(result.score).toBe(100);
    expect(result.skipped).toBe(false);
    expect(result.details).toContain("10 USD");
  });

  it("flags hosting cost concerns", () => {
    const result = checkCost(
      makeManifest({
        cost_budget: { monthly_max: "10 USD", alert_at: null },
        infrastructure: { hosting: "vercel", database: null, apis: [] },
      }),
    );
    expect(result.score).toBe(95);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("flags database cost concerns", () => {
    const result = checkCost(
      makeManifest({
        cost_budget: { monthly_max: "5 USD", alert_at: null },
        infrastructure: { hosting: null, database: "supabase", apis: [] },
      }),
    );
    expect(result.score).toBe(95);
  });

  it("flags multiple concerns with higher penalty", () => {
    const result = checkCost(
      makeManifest({
        cost_budget: { monthly_max: "10 USD", alert_at: null },
        infrastructure: {
          hosting: "vercel",
          database: "supabase",
          apis: ["stripe", "openai", "twilio"],
        },
      }),
    );
    expect(result.score).toBe(85); // 3 concerns * 5 = 15 penalty
  });
});
