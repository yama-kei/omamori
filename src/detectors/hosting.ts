import { existsSync } from "node:fs";
import { join } from "node:path";
import type { HostingResult } from "./types.js";

const FILE_MAP: [string, string][] = [
  ["vercel.json", "vercel"],
  ["netlify.toml", "netlify"],
  ["wrangler.toml", "cloudflare-workers"],
  ["fly.toml", "fly"],
  ["render.yaml", "render"],
  ["railway.json", "railway"],
  ["Dockerfile", "docker"],
];

export function detectHosting(projectDir: string): HostingResult {
  for (const [file, hosting] of FILE_MAP) {
    if (existsSync(join(projectDir, file))) {
      return { hosting };
    }
  }
  return { hosting: null };
}
