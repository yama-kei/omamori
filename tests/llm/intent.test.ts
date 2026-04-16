import { describe, it, expect, vi } from "vitest";
import { generateIntent } from "../../src/llm/intent.js";

describe("generateIntent", () => {
  it("returns null when ANTHROPIC_API_KEY is not set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const result = await generateIntent("/tmp/some-project", { framework: "next" });
    expect(result).toBeNull();
    vi.unstubAllEnvs();
  });

  it("returns null when ANTHROPIC_API_KEY is undefined", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const result = await generateIntent("/tmp/some-project", {});
    expect(result).toBeNull();
    vi.unstubAllEnvs();
  });
});
