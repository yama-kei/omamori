import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { UrlResult, PackageJson } from "./types.js";

export function detectUrl(projectDir: string): UrlResult {
  // Priority 1: package.json homepage
  const pkgPath = join(projectDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const content = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(content) as PackageJson;
      if (pkg.homepage && pkg.homepage.startsWith("http")) {
        return { url: pkg.homepage };
      }
    } catch {
      // ignore parse errors
    }
  }

  // Priority 2: CNAME file
  const cnamePath = join(projectDir, "CNAME");
  if (existsSync(cnamePath)) {
    const cname = readFileSync(cnamePath, "utf-8").trim();
    if (cname) {
      return { url: `https://${cname}` };
    }
  }

  return { url: null };
}
