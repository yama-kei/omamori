import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";
import type { DetectionResult, SoftwareGraph, GraphFile, GraphDependency, GraphApi, PackageJson } from "../detectors/types.js";

const FILE_ROLE_PATTERNS: [RegExp, string][] = [
  [/app\/.*page\.[jt]sx?$/, "route"],
  [/pages\/.*\.[jt]sx?$/, "route"],
  [/app\/.*layout\.[jt]sx?$/, "layout"],
  [/api\/.*\.[jt]s$/, "api-route"],
  [/components?\/.*\.[jt]sx?$/, "component"],
  [/hooks?\/.*\.[jt]sx?$/, "hook"],
  [/lib\/.*\.[jt]sx?$/, "library"],
  [/utils?(?:\/.*|)\.[jt]sx?$/, "utility"],
  [/middleware\.[jt]sx?$/, "middleware"],
  [/.*\.config\.[jt]sx?$/, "config"],
];

const API_PACKAGES: Record<string, string> = {
  stripe: "stripe",
  openai: "openai",
  "@anthropic-ai/sdk": "anthropic",
  "@sendgrid/mail": "sendgrid",
  twilio: "twilio",
  resend: "resend",
  "@slack/web-api": "slack",
  "discord.js": "discord",
};

function classifyFile(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  for (const [pattern, role] of FILE_ROLE_PATTERNS) {
    if (pattern.test(normalized)) {
      return role;
    }
  }
  return "source";
}

function stripVersion(version: string): string {
  return version.replace(/^[\^~]/, "");
}

export function generateGraph(projectDir: string, detection: DetectionResult): void {
  // Scan source files
  const globs = [
    "src/**/*.{ts,tsx,js,jsx}",
    "app/**/*.{ts,tsx,js,jsx}",
    "pages/**/*.{ts,tsx,js,jsx}",
  ];

  const filePaths = fg.sync(globs, {
    cwd: projectDir,
    ignore: ["node_modules/**", "dist/**", ".next/**"],
  });

  const files: GraphFile[] = filePaths.map((filePath) => ({
    path: filePath,
    role: classifyFile(filePath),
  }));

  // Read dependencies from package.json
  const dependencies: GraphDependency[] = [];
  let pkg: PackageJson | null;

  try {
    const content = readFileSync(join(projectDir, "package.json"), "utf-8");
    pkg = JSON.parse(content) as PackageJson;
  } catch {
    pkg = null;
  }

  if (pkg) {
    for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
      dependencies.push({ name, version: stripVersion(version), type: "production" });
    }
    for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
      dependencies.push({ name, version: stripVersion(version), type: "development" });
    }
  }

  // Find external APIs
  const externalApis: GraphApi[] = [];
  if (pkg) {
    const allDeps: Record<string, string> = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };

    for (const [sdkPackage, apiName] of Object.entries(API_PACKAGES)) {
      if (sdkPackage in allDeps) {
        externalApis.push({
          name: apiName,
          sdkPackage,
          version: stripVersion(allDeps[sdkPackage]),
        });
      }
    }
  }

  const graph: SoftwareGraph = {
    files,
    dependencies,
    externalApis,
    envVars: detection.env.envVars,
    infrastructure: {
      framework: detection.framework.framework,
      hosting: detection.hosting.hosting,
      database: detection.database.database,
      auth: detection.auth.auth,
    },
  };

  const outputDir = join(projectDir, ".omamori");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "graph.json"), JSON.stringify(graph, null, 2));
}
