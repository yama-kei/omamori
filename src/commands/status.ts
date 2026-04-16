import type { Command } from "commander";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show project health status")
    .action(() => {
      console.log("omamori status — not implemented yet");
    });
}
