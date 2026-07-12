import { homedir, platform } from "node:os";
import { join } from "node:path";

function computeConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && xdg.length > 0) return join(xdg, "gad");
  if (platform() === "win32") {
    return join(process.env.APPDATA ?? homedir(), "gad");
  }
  return join(homedir(), ".config", "gad");
}

export const configDir = computeConfigDir();
export const configFile = join(configDir, "config.yaml");
export const credentialsFile = join(configDir, "credentials.yaml");
export const clientSecretFile = join(configDir, "client_secret.json");
