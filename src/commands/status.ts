import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import { parse as yamlParse } from "yaml";
import type { SoftwareGraph } from "../detectors/types.js";
import type { ManifestData } from "../checks/types.js";
import { loadProjects } from "../generators/portfolio.js";
import { runChecks } from "../checks/index.js";
import { formatPortfolio, type ProjectStatus } from "../formatters/portfolio.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show project health status")
    .option("--config-dir <path>", "Config directory for portfolio")
    .action(async (options: { configDir?: string }) => {
      const entries = loadProjects(options.configDir);

      if (entries.length === 0) {
        console.log(
          "\nNo projects onboarded yet. Run 'omamori init' in a project directory.\n",
        );
        return;
      }

      const statuses: ProjectStatus[] = [];

      for (const entry of entries) {
        if (!existsSync(entry.path)) {
          statuses.push({
            name: entry.name,
            path: entry.path,
            report: null,
            error: `project directory not found (${entry.path})`,
          });
          continue;
        }

        const manifestPath = join(entry.path, "omamori.yaml");
        const graphPath = join(entry.path, ".omamori", "graph.json");

        if (!existsSync(manifestPath) || !existsSync(graphPath)) {
          statuses.push({
            name: entry.name,
            path: entry.path,
            report: null,
            error: "omamori.yaml or graph.json missing — run 'omamori init'",
          });
          continue;
        }

        try {
          const manifest = yamlParse(
            readFileSync(manifestPath, "utf-8"),
          ) as ManifestData;
          const graph = JSON.parse(
            readFileSync(graphPath, "utf-8"),
          ) as SoftwareGraph;

          const report = await runChecks(entry.path, manifest, graph);
          statuses.push({
            name: entry.name,
            path: entry.path,
            report,
            error: null,
          });
        } catch {
          statuses.push({
            name: entry.name,
            path: entry.path,
            report: null,
            error: "health check failed",
          });
        }
      }

      console.log("");
      console.log(formatPortfolio(statuses));
      console.log("");
    });
}
