import { describe, it, expect, vi } from "vitest";
import { checkIntent } from "../../src/checks/intent.js";
import type { ManifestData } from "../../src/checks/types.js";
import type { GraphFile } from "../../src/detectors/types.js";

describe("checkIntent", () => {
  it("skips when ANTHROPIC_API_KEY is not set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const manifest: ManifestData = {
      name: "test",
      goals: ["goal 1"],
      invariants: ["invariant 1"],
    };

    const result = await checkIntent("/tmp", manifest, []);
    expect(result.skipped).toBe(true);
    expect(result.details).toContain("ANTHROPIC_API_KEY");

    vi.unstubAllEnvs();
  });

  it("skips when no goals or invariants defined", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    const manifest: ManifestData = {
      name: "test",
      goals: [],
      invariants: [],
    };

    const result = await checkIntent("/tmp", manifest, []);
    expect(result.skipped).toBe(true);
    expect(result.details).toContain("no goals");

    vi.unstubAllEnvs();
  });

  it("skips when no source files found", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    const manifest: ManifestData = {
      name: "test",
      goals: ["goal 1"],
      invariants: ["invariant 1"],
    };

    const files: GraphFile[] = [
      { path: "nonexistent/file.ts", role: "route" },
    ];

    const result = await checkIntent("/tmp/nonexistent-project", manifest, files);
    expect(result.skipped).toBe(true);

    vi.unstubAllEnvs();
  });
});
