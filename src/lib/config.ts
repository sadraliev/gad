import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import { configDir, configFile } from "./paths.js";

export const ConfigSchema = z.object({
  developer_token: z.string().min(1).optional(),
  customer_id: z
    .string()
    .regex(/^\d{10}$/, "customer_id must be 10 digits, no dashes")
    .optional(),
  login_customer_id: z
    .string()
    .regex(/^\d{10}$/, "login_customer_id must be 10 digits, no dashes")
    .optional(),
  default_geo: z.string().optional(),
  default_language: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const CONFIG_KEYS = [
  "developer_token",
  "customer_id",
  "login_customer_id",
  "default_geo",
  "default_language",
] as const;

export type ConfigKey = (typeof CONFIG_KEYS)[number];

export function isConfigKey(k: string): k is ConfigKey {
  return (CONFIG_KEYS as readonly string[]).includes(k);
}

export async function readConfig(): Promise<Config> {
  if (!existsSync(configFile)) return {};
  const raw = await readFile(configFile, "utf8");
  const parsed = parseYaml(raw) ?? {};
  return ConfigSchema.parse(parsed);
}

export async function writeConfig(cfg: Config): Promise<void> {
  ConfigSchema.parse(cfg);
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true, mode: 0o700 });
  }
  await writeFile(configFile, stringifyYaml(cfg), "utf8");
  await chmod(configFile, 0o600);
}

export async function setConfigValue(key: ConfigKey, value: string): Promise<Config> {
  const cfg = await readConfig();
  const next = { ...cfg, [key]: value };
  const validated = ConfigSchema.parse(next);
  await writeConfig(validated);
  return validated;
}

export async function unsetConfigValue(key: ConfigKey): Promise<Config> {
  const cfg = await readConfig();
  const next = { ...cfg };
  delete next[key];
  await writeConfig(next);
  return next;
}
