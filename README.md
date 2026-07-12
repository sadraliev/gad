# gad

A command-line tool for querying keyword statistics from the Google Ads API.

`gad` is a personal research CLI for pulling historical search-volume, competition, and top-of-page bid data for arbitrary lists of keywords. It is built on top of the official Google Ads API and is intended for keyword research and market analysis — not for managing campaigns.

## Status

Work in progress. First iteration targets a single feature: given a list of keywords, return their historical metrics.

## What it does

Given a list of keywords, `gad` calls `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics` and returns, for each keyword:

- Average monthly search volume
- Competition level (`LOW` / `MEDIUM` / `HIGH`) and competition index (0–100)
- Low and high top-of-page bid range
- Monthly search-volume breakdown for the last 12 months

Output is available as JSON (default), CSV, or a human-readable table.

## Planned commands

```
gad auth login                       # OAuth 2.0 loopback flow, stores refresh token
gad auth status                      # Verify credentials are valid
gad auth logout                      # Remove stored credentials

gad config set developer-token <t>   # Store Google Ads developer token
gad config set customer-id <id>      # Store Google Ads customer ID
gad config show                      # Print current configuration

gad keywords stats <word...>         # Fetch metrics for the provided keywords
    --geo <criterion-id>             # e.g. 2840 for US, 2417 for KG
    --language <criterion-id>        # e.g. 1000 for English, 1031 for Russian
    --format json|csv|table
```

## Prerequisites

Before running any `gad` command you need four things from Google. This is a one-time browser-based setup — expect roughly 20–30 minutes of active work plus a review wait for production access.

### 1. Google Ads Manager account (MCC)

A Google Ads developer token is only issued to Manager accounts, not to regular Google Ads accounts.

1. Go to https://ads.google.com/home/tools/manager-accounts/ and create a manager account.
2. Fill in name, timezone, and currency. You do not need to create campaigns or attach billing to use the Keyword Plan API.

### 2. Developer token

1. Inside your MCC, open **Tools & Settings → Setup → API Center**.
2. Fill out the developer token application form: contact info, tool description, intended usage volume, and a project URL — this repository works as the project URL.
3. **Test Access** is granted quickly and works only against test accounts. `KeywordPlanIdeaService` returns placeholder data under Test Access.
4. **Basic Access** requires a manual review (usually several days to a week). This is what you need for real search-volume data.

### 3. Google Cloud OAuth client

Can be done in parallel with waiting for developer token review.

1. Open https://console.cloud.google.com/ and create a new project (e.g. `gad-cli`).
2. **APIs & Services → Library → Google Ads API → Enable**.
3. **APIs & Services → OAuth consent screen**: choose **External** and add your own Google account to **Test users**. Without this, refresh tokens issued while the consent screen is in Testing status expire every 7 days.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**. Application type: **Desktop app**. Download the client-secret JSON — you will point `gad auth login` at it.

### 4. Customer ID

Your Google Ads customer ID appears in the top-right of the Google Ads UI as `XXX-XXX-XXXX`. Strip the dashes when passing it to `gad`. For `KeywordPlanIdeaService`, the ID of your MCC itself is sufficient — you do not need to create a sub-account.

### Wiring it into `gad`

Once you have all four:

```
gad config set developer-token <token>
gad config set customer-id <10-digit-id>
gad auth login --client-secret /path/to/client_secret.json
gad auth status
```

You are now ready to run `gad keywords stats`.

## Google Ads API surfaces used

- `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics`
- `CustomerService.Get` (for auth status verification)

## Stack

- Node.js 20+, TypeScript
- [`google-ads-api`](https://www.npmjs.com/package/google-ads-api) — Google Ads API client
- [`google-auth-library`](https://www.npmjs.com/package/google-auth-library) — OAuth 2.0
- [`commander`](https://www.npmjs.com/package/commander) — CLI parsing

## Credential storage

Credentials and configuration are stored under the standard XDG config path:

```
~/.config/gad/credentials.yaml    # OAuth client + refresh token
~/.config/gad/config.yaml         # developer token, customer ID, defaults
```

Files are written with `0600` permissions. Nothing is committed to the repository.

## Author

Adilet Sadraliev — personal project, non-commercial.

## License

MIT
