import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { EnvResult } from "./types.js";

const ENV_FILES = [".env.example", ".env.local.example", ".env.sample"];
const VAR_PATTERN = /^([A-Z][A-Z0-9_]*)=/;

export function detectEnvVars(projectDir: string): EnvResult {
  const found = new Set<string>();

  for (const filename of ENV_FILES) {
    const filePath = join(projectDir, filename);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = VAR_PATTERN.exec(trimmed);
      if (match) {
        found.add(match[1]);
      }
    }
  }

  return { envVars: Array.from(found).sort() };
}
