import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, "../dist/cli.js");

describe("omamori init (integration)", () => {
  let projectDir: string;
  let configDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "omamori-init-test-"));
    configDir = mkdtempSync(join(tmpdir(), "omamori-config-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  });

  it("detects framework and generates all output files", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        name: "test-app",
        dependencies: { next: "14.2.0", "@supabase/supabase-js": "2.0.0" },
      })
    );
    writeFileSync(join(projectDir, "vercel.json"), "{}");
    writeFileSync(join(projectDir, ".env.example"), "SUPABASE_URL=\n");
    mkdirSync(join(projectDir, "src/app"), { recursive: true });
    writeFileSync(join(projectDir, "src/app/page.tsx"), "export default function Page() {}");

    const output = execFileSync("node", [cli, "init", "--dir", projectDir, "--config-dir", configDir], {
      encoding: "utf-8",
      env: { ...process.env, ANTHROPIC_API_KEY: "" },
    });

    expect(existsSync(join(projectDir, "omamori.yaml"))).toBe(true);
    expect(existsSync(join(projectDir, ".omamori", "graph.json"))).toBe(true);
    expect(existsSync(join(configDir, "projects.json"))).toBe(true);
    expect(output).toContain("nextjs");
    expect(output).toContain("ANTHROPIC_API_KEY");
  });

  it("works on empty project", () => {
    const output = execFileSync("node", [cli, "init", "--dir", projectDir, "--config-dir", configDir], {
      encoding: "utf-8",
      env: { ...process.env, ANTHROPIC_API_KEY: "" },
    });

    expect(existsSync(join(projectDir, "omamori.yaml"))).toBe(true);
    expect(existsSync(join(projectDir, ".omamori", "graph.json"))).toBe(true);
    expect(output).toContain("omamori.yaml");
  });

  it("running init twice does not duplicate portfolio entry", () => {
    writeFileSync(join(projectDir, "package.json"), JSON.stringify({ name: "test-app" }));

    execFileSync("node", [cli, "init", "--dir", projectDir, "--config-dir", configDir], {
      encoding: "utf-8",
      env: { ...process.env, ANTHROPIC_API_KEY: "" },
    });
    execFileSync("node", [cli, "init", "--dir", projectDir, "--config-dir", configDir], {
      encoding: "utf-8",
      env: { ...process.env, ANTHROPIC_API_KEY: "" },
    });

    const entries = JSON.parse(readFileSync(join(configDir, "projects.json"), "utf-8")) as unknown[];
    expect(entries).toHaveLength(1);
  });
});
