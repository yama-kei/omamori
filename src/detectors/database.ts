import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseResult, PackageJson } from "./types.js";

const DETECTION_ORDER: [string, string][] = [
  ["@supabase/supabase-js", "supabase"],
  ["@prisma/client", "prisma"],
  ["drizzle-orm", "drizzle"],
  ["firebase", "firebase"],
  ["firebase-admin", "firebase"],
  ["mongoose", "mongodb"],
  ["mongodb", "mongodb"],
  ["pg", "postgresql"],
  ["mysql2", "mysql"],
  ["better-sqlite3", "sqlite"],
];

export function detectDatabase(projectDir: string): DatabaseResult {
  let pkg: PackageJson;
  try {
    const content = readFileSync(join(projectDir, "package.json"), "utf-8");
    pkg = JSON.parse(content) as PackageJson;
  } catch {
    return { database: null };
  }

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  for (const [dep, database] of DETECTION_ORDER) {
    if (dep in allDeps) {
      return { database };
    }
  }

  return { database: null };
}
