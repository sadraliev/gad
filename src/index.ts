#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ZodError } from "zod";
import { registerConfigCommand } from "./commands/config.js";
import { registerAuthCommand } from "./commands/auth.js";
import { registerKeywordsCommand } from "./commands/keywords.js";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8")) as {
  version: string;
  description: string;
};

const program = new Command();

program
  .name("gad")
  .description(pkg.description)
  .version(pkg.version)
  .showHelpAfterError();

registerConfigCommand(program);
registerAuthCommand(program);
registerKeywordsCommand(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof ZodError) {
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      console.error(path ? `${path}: ${issue.message}` : issue.message);
    }
  } else if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
  process.exit(1);
});
