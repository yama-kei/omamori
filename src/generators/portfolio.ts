import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { PortfolioEntry } from "../detectors/types.js";

interface ProjectsFile {
  projects: PortfolioEntry[];
}

function getDefaultConfigDir(): string {
  return join(homedir(), ".omamori");
}

export function registerProject(
  name: string,
  projectPath: string,
  configDir?: string,
): void {
  const dir = configDir ?? getDefaultConfigDir();
  mkdirSync(dir, { recursive: true });

  const filePath = join(dir, "projects.json");
  let data: ProjectsFile = { projects: [] };

  if (existsSync(filePath)) {
    try {
      data = JSON.parse(readFileSync(filePath, "utf-8")) as ProjectsFile;
    } catch {
      data = { projects: [] };
    }
  }

  const existingIndex = data.projects.findIndex((p) => p.path === projectPath);
  const entry: PortfolioEntry = {
    name,
    path: projectPath,
    onboardedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    data.projects[existingIndex] = entry;
  } else {
    data.projects.push(entry);
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2));
}
