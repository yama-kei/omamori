import type { Command } from "commander";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Omamori for a project")
    .action(() => {
      console.log("omamori init — not implemented yet");
    });
}
