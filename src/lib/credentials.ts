import { mkdir, readFile, writeFile, chmod, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import { configDir, credentialsFile, clientSecretFile } from "./paths.js";

export const CredentialsSchema = z.object({
  refresh_token: z.string().min(1),
  access_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
  expiry_date: z.number().optional(),
  obtained_at: z.string().optional(),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

const ClientSecretSchema = z.object({
  installed: z.object({
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    redirect_uris: z.array(z.string()).optional(),
  }),
});

export type ClientSecret = z.infer<typeof ClientSecretSchema>["installed"];

export async function readClientSecret(): Promise<ClientSecret> {
  if (!existsSync(clientSecretFile)) {
    throw new Error(
      `client_secret.json not found at ${clientSecretFile}. Download it from Google Cloud Console (OAuth 2.0 Client ID, Desktop app) and place it there.`,
    );
  }
  const raw = await readFile(clientSecretFile, "utf8");
  const parsed = ClientSecretSchema.parse(JSON.parse(raw));
  return parsed.installed;
}

export async function readCredentials(): Promise<Credentials | null> {
  if (!existsSync(credentialsFile)) return null;
  const raw = await readFile(credentialsFile, "utf8");
  const parsed = parseYaml(raw) ?? {};
  return CredentialsSchema.parse(parsed);
}

export async function writeCredentials(creds: Credentials): Promise<void> {
  CredentialsSchema.parse(creds);
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true, mode: 0o700 });
  }
  await writeFile(credentialsFile, stringifyYaml(creds), "utf8");
  await chmod(credentialsFile, 0o600);
}

export async function deleteCredentials(): Promise<boolean> {
  if (!existsSync(credentialsFile)) return false;
  await unlink(credentialsFile);
  return true;
}
