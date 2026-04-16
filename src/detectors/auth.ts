import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AuthResult, PackageJson } from "./types.js";

type AuthPattern =
  | { type: "exact"; dep: string; auth: string }
  | { type: "regex"; pattern: RegExp; auth: string };

const PATTERNS: AuthPattern[] = [
  { type: "exact", dep: "next-auth", auth: "next-auth" },
  { type: "exact", dep: "@clerk/nextjs", auth: "clerk" },
  { type: "exact", dep: "@clerk/clerk-react", auth: "clerk" },
  { type: "regex", pattern: /^@supabase\/auth-helpers/, auth: "supabase-auth" },
  { type: "exact", dep: "@supabase/ssr", auth: "supabase-auth" },
  { type: "exact", dep: "@auth0/nextjs-auth0", auth: "auth0" },
  { type: "exact", dep: "@auth0/auth0-react", auth: "auth0" },
  { type: "exact", dep: "firebase-admin", auth: "firebase-auth" },
  { type: "exact", dep: "@lucia-auth/core", auth: "lucia" },
];

export function detectAuth(projectDir: string): AuthResult {
  let pkg: PackageJson;
  try {
    const content = readFileSync(join(projectDir, "package.json"), "utf-8");
    pkg = JSON.parse(content) as PackageJson;
  } catch {
    return { auth: null };
  }

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  const depNames = Object.keys(allDeps);

  for (const pattern of PATTERNS) {
    if (pattern.type === "exact") {
      if (pattern.dep in allDeps) {
        return { auth: pattern.auth };
      }
    } else {
      const match = depNames.find((dep) => pattern.pattern.test(dep));
      if (match !== undefined) {
        return { auth: pattern.auth };
      }
    }
  }

  return { auth: null };
}
