import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerProject } from "../../src/generators/portfolio.js";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "omamori-portfolio-test-"));
}

describe("registerProject", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a new entry when projects.json does not exist", () => {
    tempDir = makeTempDir();
    registerProject("my-app", "/home/user/projects/my-app", tempDir);

    const entries = JSON.parse(readFileSync(join(tempDir, "projects.json"), "utf-8")) as
      { name: string; path: string; onboardedAt: string }[];

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("my-app");
    expect(entries[0].path).toBe("/home/user/projects/my-app");
    expect(entries[0].onboardedAt).toBeTruthy();
  });

  it("appends a new entry to an existing projects.json", () => {
    tempDir = makeTempDir();
    registerProject("app-one", "/home/user/projects/app-one", tempDir);
    registerProject("app-two", "/home/user/projects/app-two", tempDir);

    const entries = JSON.parse(readFileSync(join(tempDir, "projects.json"), "utf-8")) as
      { name: string; path: string; onboardedAt: string }[];

    expect(entries).toHaveLength(2);
    expect(entries.map((p) => p.name)).toEqual(["app-one", "app-two"]);
  });

  it("updates (not duplicates) an existing entry when same path is registered again", () => {
    tempDir = makeTempDir();
    registerProject("my-app", "/home/user/projects/my-app", tempDir);
    registerProject("my-app", "/home/user/projects/my-app", tempDir);

    const entries = JSON.parse(readFileSync(join(tempDir, "projects.json"), "utf-8")) as
      { name: string; path: string; onboardedAt: string }[];

    expect(entries).toHaveLength(1);
    expect(entries[0].path).toBe("/home/user/projects/my-app");
  });

  it("updates name when path matches but name differs", () => {
    tempDir = makeTempDir();
    registerProject("old-name", "/home/user/projects/my-app", tempDir);
    registerProject("new-name", "/home/user/projects/my-app", tempDir);

    const entries = JSON.parse(readFileSync(join(tempDir, "projects.json"), "utf-8")) as
      { name: string; path: string; onboardedAt: string }[];

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("new-name");
    expect(entries[0].path).toBe("/home/user/projects/my-app");
  });
});
