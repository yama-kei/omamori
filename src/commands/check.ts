import type { Command } from "commander";

export function registerCheckCommand(program: Command): void {
  program
    .command("check")
    .description("Run health checks on your project")
    .action(() => {
      console.log("omamori check — not implemented yet");
    });
}
