import { OAuth2Client } from "google-auth-library";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { spawn } from "node:child_process";
import { platform } from "node:os";
import { readClientSecret, readCredentials, type Credentials } from "./credentials.js";

export const ADWORDS_SCOPE = "https://www.googleapis.com/auth/adwords";

function openBrowser(url: string): void {
  const cmd =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
        ? "cmd"
        : "xdg-open";
  const args = platform() === "win32" ? ["/c", "start", "", url] : [url];
  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
}

/**
 * Runs the OAuth 2.0 loopback authorization code flow (with PKCE) per RFC 8252.
 * Opens the operator's browser, listens on a random loopback port, exchanges
 * the code for tokens. Returns the token payload; callers persist it.
 */
export async function runLoopbackAuth(): Promise<Credentials> {
  const cs = await readClientSecret();

  return new Promise<Credentials>((resolve, reject) => {
    let oauthClient: OAuth2Client | null = null;
    let codeVerifierValue: string | null = null;
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        const err = url.searchParams.get("error");
        if (err) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(`Authorization failed: ${err}. You can close this tab.`);
          server.close();
          reject(new Error(`OAuth error from Google: ${err}`));
          return;
        }
        const code = url.searchParams.get("code");
        if (!code) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Waiting for authorization code…");
          return;
        }
        if (!oauthClient || !codeVerifierValue) {
          reject(new Error("Internal state error: OAuth client not initialized"));
          return;
        }
        const { tokens } = await oauthClient.getToken({
          code,
          codeVerifier: codeVerifierValue,
        });
        if (!tokens.refresh_token) {
          throw new Error(
            "Google did not return a refresh token. Revoke the app at https://myaccount.google.com/permissions and run `gad auth login` again.",
          );
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(
          `<!doctype html><meta charset="utf-8"><title>gad</title>
           <body style="font-family: system-ui; padding: 3rem; max-width: 40rem">
           <h2>Authorization complete</h2>
           <p>gad has stored your credentials. You can close this tab and return to the terminal.</p>
           </body>`,
        );
        server.close();

        const creds: Credentials = {
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token ?? undefined,
          scope: tokens.scope ?? ADWORDS_SCOPE,
          token_type: tokens.token_type ?? "Bearer",
          expiry_date: tokens.expiry_date ?? undefined,
          obtained_at: new Date().toISOString(),
        };
        resolve(creds);
      } catch (e) {
        res.statusCode = 500;
        res.end("Internal error");
        server.close();
        reject(e);
      }
    });

    server.on("error", reject);

    server.listen(0, "127.0.0.1", async () => {
      const addr = server.address() as AddressInfo;
      const redirectUri = `http://127.0.0.1:${addr.port}`;

      oauthClient = new OAuth2Client({
        clientId: cs.client_id,
        clientSecret: cs.client_secret,
        redirectUri,
      });

      const { codeVerifier, codeChallenge } = await oauthClient.generateCodeVerifierAsync();
      codeVerifierValue = codeVerifier;
      const authUrl = oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [ADWORDS_SCOPE],
        code_challenge_method: "S256" as never,
        code_challenge: codeChallenge,
      });

      console.log("Opening browser for Google sign-in…");
      console.log(`If it does not open, paste this URL manually:\n${authUrl}\n`);
      openBrowser(authUrl);
    });
  });
}

/**
 * Constructs an authenticated OAuth2Client from persisted credentials.
 * Throws if credentials or client_secret are missing.
 */
export async function loadAuthenticatedClient(): Promise<OAuth2Client> {
  const cs = await readClientSecret();
  const creds = await readCredentials();
  if (!creds) {
    throw new Error(
      "Not logged in. Run `gad auth login` first.",
    );
  }
  const client = new OAuth2Client({
    clientId: cs.client_id,
    clientSecret: cs.client_secret,
  });
  client.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.access_token,
    scope: creds.scope,
    token_type: creds.token_type,
    expiry_date: creds.expiry_date,
  });
  return client;
}
