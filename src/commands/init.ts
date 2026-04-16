import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import type { Command } from "commander";
import { runDetectors } from "../detectors/index.js";
import { generateManifest } from "../generators/manifest.js";
import { generateGraph } from "../generators/graph.js";
import { registerProject } from "../generators/portfolio.js";
import { generateIntent } from "../llm/intent.js";
import type { PackageJson } from "../detectors/types.js";

function getProjectName(projectDir: string): string {
  const pkgPath = resolve(projectDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as PackageJson;
      if (pkg.name) return pkg.name;
    } catch { /* fall through */ }
  }
  return resolve(projectDir).split("/").pop() ?? "unknown";
}

function formatDetection(label: string, value: string | null, version?: string | null): string {
  if (!value) return "";
  const display = version ? `${value} ${version}` : value;
  return `  ${label.padEnd(16)}${display}`;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Omamori for a project")
    .option("--dir <path>", "Project directory to analyze", ".")
    .option("--config-dir <path>", "Config directory for portfolio")
    .action(async (options: { dir: string; configDir?: string }) => {
      const projectDir = resolve(options.dir);
      const projectName = getProjectName(projectDir);

      console.log("\n🔍 Analyzing project...\n");

      const detection = runDetectors(projectDir);

      // Print detection summary
      const lines = [
        formatDetection("Framework:", detection.framework.framework, detection.framework.version),
        formatDetection("Hosting:", detection.hosting.hosting),
        formatDetection("Database:", detection.database.database),
        formatDetection("Auth:", detection.auth.auth),
        detection.apis.apis.length > 0
          ? `  ${"External APIs:".padEnd(16)}${detection.apis.apis.join(", ")}`
          : "",
        detection.env.envVars.length > 0
          ? `  ${"Env vars:".padEnd(16)}${detection.env.envVars.length} detected`
          : "",
      ].filter(Boolean);

      if (lines.length > 0) {
        console.log(lines.join("\n"));
        console.log();
      }

      // LLM intent
      let intent = null;
      if (process.env.ANTHROPIC_API_KEY) {
        console.log("🤖 Generating intent manifest...\n");
        intent = await generateIntent(projectDir, {
          framework: detection.framework.framework,
          hosting: detection.hosting.hosting,
          database: detection.database.database,
          auth: detection.auth.auth,
          apis: detection.apis.apis,
        });
      } else {
        console.log("⚠  ANTHROPIC_API_KEY not set — skipping LLM intent generation\n");
      }

      generateManifest(projectDir, projectName, detection, intent);
      console.log("✓ Created omamori.yaml");

      generateGraph(projectDir, detection);
      console.log("✓ Created .omamori/graph.json");

      registerProject(projectName, projectDir, options.configDir);
      console.log("✓ Registered in ~/.omamori/projects.json");

      console.log("\nReview your intent manifest:");
      console.log("  cat omamori.yaml");
      console.log("\nEdit goals, non-goals, and invariants to match your intent.\n");
    });
}
