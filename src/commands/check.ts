import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import type { Command } from "commander";
import { parse as yamlParse } from "yaml";
import type { SoftwareGraph } from "../detectors/types.js";
import type { ManifestData } from "../checks/types.js";
import { runChecks } from "../checks/index.js";
import { formatHealthReport } from "../formatters/health-report.js";

export function registerCheckCommand(program: Command): void {
  program
    .command("check")
    .description("Run health checks on your project")
    .option("--dir <path>", "Project directory to check", ".")
    .action(async (options: { dir: string }) => {
      const projectDir = resolve(options.dir);
      const manifestPath = join(projectDir, "omamori.yaml");
      const graphPath = join(projectDir, ".omamori", "graph.json");

      if (!existsSync(manifestPath)) {
        console.error(
          "Error: omamori.yaml not found. Run `omamori init` first.",
        );
        process.exit(1);
      }

      if (!existsSync(graphPath)) {
        console.error(
          "Error: .omamori/graph.json not found. Run `omamori init` first.",
        );
        process.exit(1);
      }

      const manifest = yamlParse(
        readFileSync(manifestPath, "utf-8"),
      ) as ManifestData;

      const graph = JSON.parse(
        readFileSync(graphPath, "utf-8"),
      ) as SoftwareGraph;

      console.log("");
      const report = await runChecks(projectDir, manifest, graph);
      console.log(formatHealthReport(report));
      console.log("");
    });
}
