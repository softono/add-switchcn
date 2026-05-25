#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";
import { installSwitchcn } from "../src/commands/install.js";

const program = new Command();

program
  .name("add-switchcn")
  .description("Install the SwitchCN theme switcher into your project.")
  .version("0.1.0")
  .action(async () => {
    try {
      await installSwitchcn();
    } catch (error) {
      console.error(pc.red(error.message));
      process.exitCode = 1;
    }
  });

await program.parseAsync(process.argv);
