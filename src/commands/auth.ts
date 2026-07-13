import { Command } from "commander";
import { existsSync } from "node:fs";
import { runLoopbackAuth, loadAuthenticatedClient } from "../lib/oauth.js";
import {
  writeCredentials,
  readCredentials,
  deleteCredentials,
} from "../lib/credentials.js";
import { clientSecretFile, credentialsFile } from "../lib/paths.js";

export function registerAuthCommand(program: Command): void {
  const auth = program.command("auth").description("Manage OAuth credentials");

  auth
    .command("login")
    .description("Run the OAuth 2.0 loopback flow and store a refresh token")
    .action(async () => {
      if (!existsSync(clientSecretFile)) {
        console.error(
          `client_secret.json not found at ${clientSecretFile}.\n` +
            `Download it from Google Cloud Console (OAuth 2.0 Client ID, Desktop app) and place it at that path.`,
        );
        process.exit(2);
      }
      const creds = await runLoopbackAuth();
      await writeCredentials(creds);
      console.log(`Credentials stored at ${credentialsFile}`);
    });

  auth
    .command("status")
    .description("Verify stored credentials by refreshing the access token")
    .action(async () => {
      const stored = await readCredentials();
      if (!stored) {
        console.error("Not logged in. Run `gad auth login`.");
        process.exit(1);
      }
      const client = await loadAuthenticatedClient();
      const { token } = await client.getAccessToken();
      if (!token) {
        console.error("Refresh failed: no access token returned.");
        process.exit(1);
      }
      console.log("OK");
      if (stored.obtained_at) console.log(`obtained: ${stored.obtained_at}`);
      if (stored.scope) console.log(`scope:    ${stored.scope}`);
    });

  auth
    .command("logout")
    .description("Delete stored credentials")
    .action(async () => {
      const removed = await deleteCredentials();
      if (removed) {
        console.log(`Removed ${credentialsFile}`);
      } else {
        console.log("Nothing to remove.");
      }
    });
}
