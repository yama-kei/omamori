import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { PortfolioEntry } from "../detectors/types.js";

function getDefaultConfigDir(): string {
  return join(homedir(), ".omamori");
}

export function loadProjects(configDir?: string): PortfolioEntry[] {
  const dir = configDir ?? getDefaultConfigDir();
  const filePath = join(dir, "projects.json");

  if (!existsSync(filePath)) return [];

  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8")) as
      | PortfolioEntry[]
      | { projects: PortfolioEntry[] };
    return Array.isArray(raw) ? raw : raw.projects ?? [];
  } catch {
    return [];
  }
}

export function registerProject(
  name: string,
  projectPath: string,
  configDir?: string,
): void {
  const dir = configDir ?? getDefaultConfigDir();
  mkdirSync(dir, { recursive: true });

  const filePath = join(dir, "projects.json");
  let entries: PortfolioEntry[] = [];

  if (existsSync(filePath)) {
    try {
      const raw = JSON.parse(readFileSync(filePath, "utf-8")) as
        | PortfolioEntry[]
        | { projects: PortfolioEntry[] };
      entries = Array.isArray(raw) ? raw : raw.projects ?? [];
    } catch {
      entries = [];
    }
  }

  const existingIndex = entries.findIndex((p) => p.path === projectPath);
  const entry: PortfolioEntry = {
    name,
    path: projectPath,
    onboardedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  writeFileSync(filePath, JSON.stringify(entries, null, 2) + "\n");
}
