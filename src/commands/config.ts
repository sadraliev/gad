import { Command } from "commander";
import {
  CONFIG_KEYS,
  isConfigKey,
  readConfig,
  setConfigValue,
  unsetConfigValue,
} from "../lib/config.js";
import { configFile } from "../lib/paths.js";

export function registerConfigCommand(program: Command): void {
  const cfg = program.command("config").description("Manage gad configuration");

  cfg
    .command("set <key> <value>")
    .description(`Set a config value. Keys: ${CONFIG_KEYS.join(", ")}`)
    .action(async (key: string, value: string) => {
      if (!isConfigKey(key)) {
        console.error(`unknown key: ${key}`);
        console.error(`valid keys: ${CONFIG_KEYS.join(", ")}`);
        process.exit(2);
      }
      await setConfigValue(key, value);
      console.log(`${key} set`);
    });

  cfg
    .command("get <key>")
    .description("Print a single config value")
    .action(async (key: string) => {
      if (!isConfigKey(key)) {
        console.error(`unknown key: ${key}`);
        process.exit(2);
      }
      const c = await readConfig();
      const v = c[key];
      if (v === undefined) {
        process.exit(1);
      }
      console.log(v);
    });

  cfg
    .command("unset <key>")
    .description("Remove a config value")
    .action(async (key: string) => {
      if (!isConfigKey(key)) {
        console.error(`unknown key: ${key}`);
        process.exit(2);
      }
      await unsetConfigValue(key);
      console.log(`${key} unset`);
    });

  cfg
    .command("show")
    .description("Print the full config, redacting sensitive fields")
    .option("--reveal", "show developer_token in full")
    .action(async (opts: { reveal?: boolean }) => {
      const c = await readConfig();
      const view: Record<string, string> = {};
      for (const k of CONFIG_KEYS) {
        const v = c[k];
        if (v === undefined) continue;
        if (k === "developer_token" && !opts.reveal) {
          view[k] = v.length <= 6 ? "***" : `${v.slice(0, 3)}***${v.slice(-3)}`;
        } else {
          view[k] = v;
        }
      }
      console.log(`# ${configFile}`);
      if (Object.keys(view).length === 0) {
        console.log("(empty)");
        return;
      }
      for (const [k, v] of Object.entries(view)) {
        console.log(`${k}: ${v}`);
      }
    });

  cfg
    .command("path")
    .description("Print the config file path")
    .action(() => {
      console.log(configFile);
    });
}
