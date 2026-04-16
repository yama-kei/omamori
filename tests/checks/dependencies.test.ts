import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkDependencies } from "../../src/checks/dependencies.js";
import type { GraphDependency } from "../../src/detectors/types.js";

describe("checkDependencies", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 100 when no production dependencies", async () => {
    const result = await checkDependencies([]);
    expect(result.score).toBe(100);
    expect(result.skipped).toBe(false);
    expect(result.details).toContain("no production dependencies");
  });

  it("returns 100 when all deps are up to date", async () => {
    const deps: GraphDependency[] = [
      { name: "next", version: "14.2.0", type: "production" },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: "14.2.0" }),
    });

    const result = await checkDependencies(deps);
    expect(result.score).toBe(100);
    expect(result.details).toContain("up to date");
  });

  it("penalizes stale dependencies", async () => {
    const deps: GraphDependency[] = [
      { name: "react", version: "17.0.0", type: "production" },
      { name: "next", version: "13.0.0", type: "production" },
    ];

    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: "18.3.0" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: "14.2.0" }),
      });

    const result = await checkDependencies(deps);
    expect(result.score).toBeLessThan(100);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.details).toContain("behind latest");
  });

  it("skips development dependencies", async () => {
    const deps: GraphDependency[] = [
      { name: "vitest", version: "1.0.0", type: "development" },
    ];

    const result = await checkDependencies(deps);
    expect(result.score).toBe(100);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("handles fetch failures gracefully", async () => {
    const deps: GraphDependency[] = [
      { name: "nonexistent-pkg", version: "1.0.0", type: "production" },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const result = await checkDependencies(deps);
    expect(result.score).toBe(100);
    expect(result.skipped).toBe(false);
  });
});
