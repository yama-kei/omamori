#!/usr/bin/env node

import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";
import { registerCheckCommand } from "./commands/check.js";
import { registerStatusCommand } from "./commands/status.js";

const program = new Command();

program
  .name("omamori")
  .description("Your app sitter — health monitoring for personal software")
  .version("0.1.0");

registerInitCommand(program);
registerCheckCommand(program);
registerStatusCommand(program);

program.parse();
