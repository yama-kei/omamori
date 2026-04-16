import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DetectionResult } from "../../src/detectors/types.js";
import { generateGraph } from "../../src/generators/graph.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-graph-test-"));
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

describe("generateGraph", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("generates a graph with dependencies, source files, and APIs", () => {
    tempDir = makeTempDir();

    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        name: "my-app",
        dependencies: {
          next: "^14.0.0",
          stripe: "^14.0.0",
          react: "^18.0.0",
        },
        devDependencies: {
          typescript: "^5.0.0",
        },
      }),
    );

    // Create source files
    mkdirSync(join(tempDir, "src"), { recursive: true });
    writeFileSync(join(tempDir, "src", "utils.ts"), "export const foo = 1;");

    mkdirSync(join(tempDir, "app"), { recursive: true });
    writeFileSync(join(tempDir, "app", "page.tsx"), "export default function Page() {}");
    writeFileSync(join(tempDir, "app", "layout.tsx"), "export default function Layout() {}");

    mkdirSync(join(tempDir, "src", "components"), { recursive: true });
    writeFileSync(join(tempDir, "src", "components", "Button.tsx"), "export const Button = () => {};");

    const detection = makeDetectionResult({
      framework: { framework: "nextjs", version: "14.0.0" },
      hosting: { hosting: "vercel" },
      database: { database: "supabase" },
      auth: { auth: "next-auth" },
      env: { envVars: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_URL"] },
    });

    generateGraph(tempDir, detection);

    const graphPath = join(tempDir, ".omamori", "graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf-8")) as {
      files: { path: string; role: string }[];
      dependencies: { name: string; version: string; type: string }[];
      externalApis: { name: string; sdkPackage: string; version: string }[];
      envVars: string[];
      infrastructure: { framework: string | null; hosting: string | null; database: string | null; auth: string | null };
    };

    // Check infrastructure
    expect(graph.infrastructure).toEqual({
      framework: "nextjs",
      hosting: "vercel",
      database: "supabase",
      auth: "next-auth",
    });

    // Check env vars
    expect(graph.envVars).toEqual(["STRIPE_SECRET_KEY", "NEXT_PUBLIC_URL"]);

    // Check dependencies
    const nextDep = graph.dependencies.find((d) => d.name === "next");
    expect(nextDep).toEqual({ name: "next", version: "14.0.0", type: "production" });
    const tsDep = graph.dependencies.find((d) => d.name === "typescript");
    expect(tsDep).toEqual({ name: "typescript", version: "5.0.0", type: "development" });

    // Check external APIs - stripe should be detected
    const stripeApi = graph.externalApis.find((a) => a.name === "stripe");
    expect(stripeApi).toEqual({ name: "stripe", sdkPackage: "stripe", version: "14.0.0" });

    // Check files
    const pageFile = graph.files.find((f) => f.path.includes("page.tsx"));
    expect(pageFile?.role).toBe("route");
    const layoutFile = graph.files.find((f) => f.path.includes("layout.tsx"));
    expect(layoutFile?.role).toBe("layout");
    const componentFile = graph.files.find((f) => f.path.includes("Button.tsx"));
    expect(componentFile?.role).toBe("component");
    const utilFile = graph.files.find((f) => f.path.includes("utils.ts"));
    expect(utilFile?.role).toBe("utility");
  });

  it("generates an empty graph for an empty project", () => {
    tempDir = makeTempDir();

    const detection = makeDetectionResult();
    generateGraph(tempDir, detection);

    const graphPath = join(tempDir, ".omamori", "graph.json");
    const graph = JSON.parse(readFileSync(graphPath, "utf-8")) as {
      files: unknown[];
      dependencies: unknown[];
      externalApis: unknown[];
      envVars: unknown[];
      infrastructure: { framework: string | null; hosting: string | null; database: string | null; auth: string | null };
    };

    expect(graph.files).toEqual([]);
    expect(graph.dependencies).toEqual([]);
    expect(graph.externalApis).toEqual([]);
    expect(graph.envVars).toEqual([]);
    expect(graph.infrastructure).toEqual({
      framework: null,
      hosting: null,
      database: null,
      auth: null,
    });
  });
});
