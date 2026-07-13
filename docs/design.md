# gad — Design Document

**Author:** Adilet Sadraliev
**Contact:** a.sadraliev@gmail.com
**Repository:** https://github.com/sadraliev/gad
**Access level requested:** Basic Access
**Document version:** 1.0

---

## 1. Overview

`gad` is a personal, non-commercial command-line tool for keyword research on the operator's local machine. It is not a product, not a service, and not distributed to users beyond its author.

The tool has one purpose: given a list of keywords supplied on the command line, retrieve historical performance metrics from Google Ads and print them to the operator's terminal.

There is no user interface beyond the CLI, no web front-end, no persistent server, and no shared multi-tenant deployment.

## 2. Users and access

- **Number of users:** 1 (the author).
- **Distribution:** The tool is not published to any package registry or app store. It is cloned from GitHub and built locally.
- **Authentication:** The operator (the author) authenticates to Google via OAuth 2.0 on their own machine.
- **Delegation:** No delegation. Credentials belong to the operator and never leave the operator's machine.

## 3. Architecture

Single-process CLI written in TypeScript, executed on Node.js 20+ on the operator's local machine.

```
+---------------------+       OAuth 2.0        +--------------------+
|  Operator terminal  |  ─────────────────────▶ |  Google Identity   |
|  (macOS/Linux)      | ◀─────────────────────  |  Platform (OAuth)  |
|                     |                        +--------------------+
|  gad CLI (Node.js)  |
|                     |       gRPC + auth      +--------------------+
|                     |  ─────────────────────▶ |  Google Ads API    |
|                     | ◀─────────────────────  |  (v-latest)        |
+---------------------+                        +--------------------+
        │
        ▼
+---------------------+
| Local file system   |
| ~/.config/gad/      |
|   config.yaml       |
|   credentials.yaml  |
|   client_secret.json|
+---------------------+
```

No other systems, no other endpoints, no external dependencies at runtime beyond Google Ads API and the Google OAuth endpoints.

## 4. Data flow

1. **Setup (one-time)**
   - Operator downloads an OAuth 2.0 Client ID (Desktop app type) JSON from their own Google Cloud project and places it under `~/.config/gad/client_secret.json`.
   - Operator stores their developer token and Google Ads customer ID via `gad config set developer_token …` / `gad config set customer_id …`. Values are written to `~/.config/gad/config.yaml`.
   - Operator runs `gad auth login`. This performs the OAuth 2.0 authorization code flow with PKCE using a loopback redirect (`http://127.0.0.1:<random-port>`). The resulting refresh token is written to `~/.config/gad/credentials.yaml`.

2. **Steady-state query**
   - Operator runs `gad keywords stats "buy running shoes" "trail running shoes"`.
   - CLI loads config and credentials from disk.
   - CLI refreshes the access token via Google OAuth token endpoint using the stored refresh token.
   - CLI calls `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics` on the Google Ads API with the keyword list, customer ID, developer token, geo target constant, and language constant.
   - CLI formats the returned metrics and writes them to stdout (JSON, CSV, or table).

No results, requests, or credentials are transmitted anywhere other than to Google's endpoints.

## 5. Google Ads API surfaces used

| API surface | Purpose |
|---|---|
| `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics` | Core feature: historical search volume, competition, and top-of-page bid range for user-provided keywords. |
| `CustomerService.Get` | `gad auth status` verification only — used to confirm that stored credentials are valid. Read-only, no mutations. |

No mutations to campaigns, ad groups, keywords, budgets, or any other Google Ads entity are performed by this tool. No conversion tracking, no remarketing, no reporting on account performance.

### 5.1 Supported campaign types

**None.** The tool does not support, create, edit, or manage any Google Ads campaign type (Search, Display, Video, Shopping, Performance Max, Demand Gen, App, or any other). Campaigns are outside the scope of this tool entirely.

### 5.2 Google Ads capabilities provided

The tool provides exactly one capability from the Google Ads capability catalogue:

- **Keyword Planning Services** — historical metrics lookup via `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics`.

The tool explicitly does **not** provide any of the following:

- Account Creation
- Account Management
- Campaign Creation
- Campaign Management
- Reporting (in the sense of account/campaign performance reports)
- App Conversion Tracking
- Remarketing / audience management
- Any other capability

## 6. Authentication and authorization

- **OAuth 2.0 authorization code flow with PKCE**, loopback redirect variant. Implemented per RFC 8252 (OAuth 2.0 for Native Apps). The out-of-band flow is not used.
- **Scopes requested:** `https://www.googleapis.com/auth/adwords`.
- **Client type:** Desktop application (public client). Client ID and client secret are owned by the operator's own Google Cloud project.
- **Refresh tokens** are stored on the operator's local file system with `0600` permissions and never transmitted anywhere except to Google's OAuth token endpoint.
- **Developer token** is supplied by the operator via `gad config set developer_token` and stored in `~/.config/gad/config.yaml` with `0600` permissions.
- **`login-customer-id` header** is set from the operator's MCC ID when configured.

## 7. Credential storage

All secrets live on the operator's local file system under a private config directory:

| File | Contents | Permissions |
|---|---|---|
| `~/.config/gad/client_secret.json` | OAuth 2.0 client ID and secret from GCP | 0600 |
| `~/.config/gad/credentials.yaml` | OAuth 2.0 refresh token, expiration metadata | 0600 |
| `~/.config/gad/config.yaml` | Developer token, customer ID, defaults | 0600 |

The parent directory `~/.config/gad/` is created with `0700` permissions. No secrets are ever committed to source control (`credentials.yaml`, `config.yaml`, `client_secret*.json` are listed in `.gitignore`). No secrets are ever logged to stdout or stderr; the `config show` subcommand masks the developer token by default and only reveals it with an explicit `--reveal` flag.

## 8. Usage volume and rate limits

- **Expected API operations:** fewer than 100 per day, in bursts.
- **Batching:** keyword lists are submitted as a single batched call per invocation to `GenerateKeywordHistoricalMetrics`, minimizing operation count.
- **Retries:** exponential backoff on transient gRPC errors, capped at 3 attempts.
- **Concurrency:** single-threaded; no parallel requests.

The tool operates well below any published Google Ads API quota for Basic Access.

## 9. Security considerations

- No network listeners open persistently. The only inbound connection accepted is the transient loopback socket during `gad auth login`, bound to `127.0.0.1` on a randomly assigned port, closed immediately after receiving the authorization code.
- No third-party analytics, telemetry, or crash reporting.
- No third-party network calls at runtime.
- Dependencies are pinned in `package-lock.json` and updated only by the author.
- Source is public on GitHub; anyone can audit the codebase and the exact set of API surfaces called.

## 10. Non-goals

The following are explicitly out of scope for this tool and will not be added:

- Campaign creation, editing, or budget management.
- Bid changes, negative keyword management, or any mutation of Google Ads entities.
- Conversion tracking, remarketing audience management, or offline conversion imports.
- Multi-tenant use, SaaS deployment, or user-facing web/mobile UI.
- Distribution to end users other than the author.

## 11. Compliance

The tool respects Google Ads API Terms of Service. No data received from the API is stored persistently, shared, resold, or exposed to third parties. Results are printed to the operator's terminal only and are used exclusively for the operator's own research.
