import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkEndpoints } from "../../src/checks/endpoints.js";

describe("checkEndpoints", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips when no URL configured", async () => {
    const result = await checkEndpoints(null);
    expect(result.skipped).toBe(true);
    expect(result.details).toContain("no deployed URL");
  });

  it("skips for undefined URL", async () => {
    const result = await checkEndpoints(undefined);
    expect(result.skipped).toBe(true);
  });

  it("scores high for fast 200 response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
    });

    const result = await checkEndpoints("https://example.com", 2000);
    expect(result.score).toBe(100);
    expect(result.skipped).toBe(false);
    expect(result.details).toContain("responding");
  });

  it("penalizes non-2xx response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 500,
    });

    const result = await checkEndpoints("https://example.com");
    expect(result.score).toBe(30);
    expect(result.details).toContain("500");
  });

  it("handles network errors", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("ENOTFOUND"),
    );

    const result = await checkEndpoints("https://nonexistent.example");
    expect(result.score).toBe(0);
    expect(result.details).toContain("unreachable");
  });
});
