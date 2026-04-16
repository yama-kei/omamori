import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runDetectors } from "../../src/detectors/index.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-detectors-test-"));
}

describe("runDetectors", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("detects a Next.js + Supabase + Vercel + Stripe project", () => {
    tempDir = makeTempDir();

    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        name: "my-app",
        homepage: "https://my-app.vercel.app",
        dependencies: {
          next: "^14.0.0",
          "@supabase/supabase-js": "^2.0.0",
          stripe: "^14.0.0",
          "@next-auth/supabase-adapter": "^0.1.0",
        },
      }),
    );

    writeFileSync(join(tempDir, "vercel.json"), JSON.stringify({ version: 2 }));

    writeFileSync(
      join(tempDir, ".env.example"),
      "STRIPE_SECRET_KEY=\nNEXT_PUBLIC_SUPABASE_URL=\nNEXTAUTH_SECRET=\n",
    );

    const result = runDetectors(tempDir);

    expect(result.framework).toEqual({ framework: "nextjs", version: "14.0.0" });
    expect(result.hosting).toEqual({ hosting: "vercel" });
    expect(result.database).toEqual({ database: "supabase" });
    expect(result.apis.apis).toContain("stripe");
    expect(result.env.envVars).toContain("STRIPE_SECRET_KEY");
    expect(result.url).toEqual({ url: "https://my-app.vercel.app" });
  });

  it("returns all nulls/empty for an empty directory", () => {
    tempDir = makeTempDir();

    const result = runDetectors(tempDir);

    expect(result.framework).toEqual({ framework: null, version: null });
    expect(result.hosting).toEqual({ hosting: null });
    expect(result.database).toEqual({ database: null });
    expect(result.apis).toEqual({ apis: [] });
    expect(result.auth).toEqual({ auth: null });
    expect(result.env).toEqual({ envVars: [] });
    expect(result.url).toEqual({ url: null });
  });
});
