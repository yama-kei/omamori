import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, "../dist/cli.js");

function run(...args: string[]): string {
  return execFileSync("node", [cli, ...args], {
    encoding: "utf-8",
  }).trim();
}

describe("omamori CLI", () => {
  it("shows help with --help", () => {
    const output = run("--help");
    expect(output).toContain("omamori");
    expect(output).toContain("init");
    expect(output).toContain("check");
    expect(output).toContain("status");
  });

  it("shows version with --version", () => {
    const output = run("--version");
    expect(output).toBe("0.1.0");
  });

  it("init prints placeholder", () => {
    const output = run("init");
    expect(output).toBe("omamori init — not implemented yet");
  });

  it("check prints placeholder", () => {
    const output = run("check");
    expect(output).toBe("omamori check — not implemented yet");
  });

  it("status prints placeholder", () => {
    const output = run("status");
    expect(output).toBe("omamori status — not implemented yet");
  });
});
