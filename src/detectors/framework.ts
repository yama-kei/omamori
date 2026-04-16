import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FrameworkResult, PackageJson } from "./types.js";

const DETECTION_ORDER: [string, string][] = [
  ["expo", "expo"],
  ["@sveltejs/kit", "sveltekit"],
  ["@remix-run/node", "remix"],
  ["next", "nextjs"],
  ["nuxt", "nuxt"],
  ["astro", "astro"],
  ["gatsby", "gatsby"],
  ["react-native", "react-native"],
  ["svelte", "svelte"],
  ["vite", "vite"],
];

function stripVersion(version: string): string {
  return version.replace(/^[\^~]/, "");
}

export function detectFramework(projectDir: string): FrameworkResult {
  let pkg: PackageJson;
  try {
    const content = readFileSync(join(projectDir, "package.json"), "utf-8");
    pkg = JSON.parse(content) as PackageJson;
  } catch {
    return { framework: null, version: null };
  }

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  for (const [dep, framework] of DETECTION_ORDER) {
    if (dep in allDeps) {
      return { framework, version: stripVersion(allDeps[dep]) };
    }
  }

  return { framework: null, version: null };
}
