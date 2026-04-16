import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkApiCompatibility } from "../../src/checks/api-compatibility.js";
import type { GraphApi } from "../../src/detectors/types.js";

describe("checkApiCompatibility", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 100 when no external APIs", async () => {
    const result = await checkApiCompatibility([]);
    expect(result.score).toBe(100);
    expect(result.details).toContain("no external API SDKs");
  });

  it("returns 100 when all SDKs are up to date", async () => {
    const apis: GraphApi[] = [
      { name: "stripe", sdkPackage: "stripe", version: "14.0.0" },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: "14.0.0" }),
    });

    const result = await checkApiCompatibility(apis);
    expect(result.score).toBe(100);
    expect(result.details).toContain("up to date");
  });

  it("penalizes major version behind more heavily", async () => {
    const apis: GraphApi[] = [
      { name: "stripe", sdkPackage: "stripe", version: "13.0.0" },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: "14.0.0" }),
    });

    const result = await checkApiCompatibility(apis);
    expect(result.score).toBe(85); // 100 - 15 for major
    expect(result.details).toContain("major");
    expect(result.recommendations[0]).toContain("approval recommended");
  });

  it("penalizes minor version behind less", async () => {
    const apis: GraphApi[] = [
      { name: "openai", sdkPackage: "openai", version: "4.0.0" },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: "4.5.0" }),
    });

    const result = await checkApiCompatibility(apis);
    expect(result.score).toBe(95); // 100 - 5 for minor
    expect(result.details).toContain("minor");
  });

  it("handles fetch failures gracefully", async () => {
    const apis: GraphApi[] = [
      { name: "stripe", sdkPackage: "stripe", version: "14.0.0" },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const result = await checkApiCompatibility(apis);
    expect(result.score).toBe(100);
  });
});
