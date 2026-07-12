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
