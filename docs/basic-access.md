# Applying for Google Ads API Basic Access

This document walks through the Google Ads API Basic Access application end-to-end: what the access levels mean, what you need before you start, how to answer every question on the application form, what supporting artifacts you must upload, how long the review takes, and what to do if the application is rejected.

## Why Basic Access matters

Google Ads API has three developer-token access levels:

| Level | What you get | Works against |
|---|---|---|
| **Test Access** | Immediate, automatic upon token issuance | Test accounts only. Production accounts return placeholder / empty data for `KeywordPlanIdeaService`. |
| **Basic Access** | Manual review, typically 5 business days | Production accounts. This is what you need to get real search-volume data. Daily operation quota is capped but sufficient for personal use. |
| **Standard Access** | Additional manual review, tighter scrutiny | Production accounts with higher quotas. Not needed for gad's expected volume. |

For gad, **Basic Access is the target**. Test Access is only useful to develop plumbing before the real credentials arrive.

## Before you apply

You must have all of the following in place before opening the application form. The form will reject you if any of these is missing or unverifiable.

1. **A Google Ads Manager (MCC) account.** Regular Google Ads accounts cannot hold developer tokens. Create one at https://ads.google.com/home/tools/manager-accounts/ if you do not have one.
2. **A pending developer token.** You submit for Basic Access *from* an existing token, not before you have one. Get a token first: inside your MCC, open Tools & Settings → Setup → API Center → Apply for developer token. Test Access is granted quickly. The Basic Access application form is a separate, longer step.
3. **A Google Cloud project with Google Ads API enabled.** Reviewers verify this. Create the project at https://console.cloud.google.com/projectcreate, then enable the API at https://console.cloud.google.com/apis/library/googleads.googleapis.com.
4. **A publicly reachable project URL.** For gad this is the GitHub repository (https://github.com/sadraliev/gad). Reviewers will open the URL and read the README.
5. **A design document (PDF, DOC, or RTF).** The form requires a file upload. See `docs/design.md` in this repository for the source; the compiled `design.pdf` is what you submit.
6. **A contact email that is actively monitored.** Reviewers contact you if they need clarifications. Missed emails result in silent application closure.

## Applying for the initial token (Test Access)

This step precedes the Basic Access application. Inside your MCC:

1. Open **Tools & Settings → Setup → API Center**.
2. Fill in the short application: contact info, tool description, intended use, project URL.
3. Submit. Test Access is issued to your MCC almost immediately.

You now have a developer token that only works against test accounts. Copy it — you will store it via `gad config set developer_token <token>` once the CLI's config command is available.

## Applying for Basic Access

Once you have a Test-level token, apply to upgrade to Basic Access. The upgrade form asks 13 questions plus acknowledgements.

### Field-by-field answers for gad

Use these verbatim unless something in your setup differs.

| # | Question | Answer |
|---|---|---|
| 1 | API contact email is accurate and up-to-date | ✅ (checkbox) |
| 2 | Google Cloud project ID | Your GCP project ID, e.g. `gad-cli-473921`. Find it at https://console.cloud.google.com/home/dashboard in the "Project info" card. |
| 3 | Google Ads MCC ID | Your MCC's 10-digit ID in `XXX-XXX-XXXX` format. Copy with dashes — the form expects that format. Find it in the top-right corner of the Google Ads UI while inside your MCC. |
| 4 | Contact email | Your primary email (e.g. `a.sadraliev@gmail.com`). A domain email is preferred but not required for internal/personal tools. |
| 5 | Ongoing relationship with a Google representative | No |
| 6 | Company website URL | `https://github.com/sadraliev/gad` |
| 7 | Business model, tool, and intended audience | See "Q7 template" below. |
| 8 | Design documentation | Upload `docs/design.pdf` from this repository. |
| 9 | Who will have access to the tool | Internal users - employees only |
| 10 | Will you use your token with a tool developed by someone else | No |
| 11 | Will you use the token for App Conversion Tracking and Remarketing | No |
| 12 | Supported campaign types | `None. This tool does not support, create, edit, or manage any Google Ads campaign type. It exclusively queries KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics for standalone keyword research and does not touch campaign entities.` |
| 13 | Capabilities provided (checkboxes) | Check **only** `Keyword Planning Services`. Leave all others unchecked. |
| — | Terms and Privacy acknowledgements | ✅ ✅ |

### Q7 template — business model, tool, audience

Paste this into Q7 verbatim (edit only if your situation differs):

```
gad is a personal, non-commercial command-line tool for keyword research. There is no business model, no clients, and no monetization — the tool is used exclusively by its author for internal research informing SEO and content decisions on personal projects.

The tool exposes a single primary capability: given a list of keywords supplied by the operator on the command line, it queries the Google Ads API method KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics and returns, per keyword: average monthly search volume, competition level and index, and low/high top-of-page bid range. Output is emitted as JSON, CSV, or a human-readable table.

Intended audience: the author only. The tool is a locally-installed CLI (Node.js) that reads credentials from ~/.config/gad/ on the operator's own machine. There is no server component, no shared deployment, no web UI, no user-facing interface beyond the terminal, and no distribution to other users.

Expected volume: under 100 API operations per day, typically in bursts of a few dozen keywords per call.
```

Q7 must consistently answer three sub-questions (business model / tool / audience). The template above hits each one explicitly and matches the design doc.

### Consistency between form and design document

Reviewers cross-check form answers against the design doc. Discrepancies trigger rejection. Ensure:

- Q9 (audience) matches design doc §2 "Users and access".
- Q11–Q13 (campaign types, capabilities) match design doc §5 including §5.1 and §5.2.
- Q7 (tool description) matches design doc §1 (Overview) and §4 (Data flow).
- Q2 (project ID) is the GCP project that has Google Ads API enabled (design doc §6).

If any of these change, regenerate `docs/design.pdf` from `docs/design.md` before submitting the form (see "Regenerating the design PDF" below).

## Regenerating the design PDF

The source is `docs/design.md`. The compiled `docs/design.pdf` is gitignored — regenerate it locally before every form submission:

```
pandoc docs/design.md -o docs/design.html --standalone --metadata title="gad — Design Document"

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=docs/design.pdf \
  file://$(pwd)/docs/design.html
```

Requires `pandoc` (`brew install pandoc`) and Google Chrome. On Linux, replace the Chrome path with `google-chrome` or `chromium`.

## Timeline expectations

- **Application acknowledgement:** immediate (auto-response).
- **First review:** typically 5 business days per Google's stated SLA.
- **Follow-up questions:** possible; reviewers may email asking for clarification. Respond within a few days.
- **Approval or rejection notice:** by email. On approval, the token in your MCC's API Center flips from Test to Basic Access; nothing changes about the token value itself.

## Common rejection reasons

Based on Google's public guidance and observed patterns:

1. **Design doc too vague.** Reviewers want specific API surfaces named, specific data flow, specific storage locations. Generic "we call the Google Ads API to get data" is rejected.
2. **Form/doc inconsistency.** Q7 says one thing, the design doc says another. Fix by regenerating the PDF from the updated Markdown source.
3. **Project URL not reachable or empty.** The GitHub repo must be public and have a README that matches the form description.
4. **Personal-use rejection.** Basic Access is nominally aimed at commercial use. Some reviewers reject purely personal applications on this basis. If this happens, reapply with a clearer statement of research purpose and any specific SEO/content projects the tool supports.
5. **Q9 and Q10 mismatch.** Selecting "Internal users only" while also indicating third-party tool involvement, or vice versa, is treated as a red flag.

## If your application is rejected

The rejection email will state a reason (sometimes vague). Actions in order:

1. Read the reason carefully. Do not resubmit blindly.
2. Update `docs/design.md` to address the specific point raised.
3. Regenerate the PDF.
4. Update the README if the form description diverged from what the repo publicly says.
5. Reapply from the same MCC's API Center.

Google does not throttle reapplications for the same tool as long as the changes address the stated concern. Multiple rounds are normal.

## What Basic Access does *not* give you

- Higher rate limits than the default Basic Access quota. For higher throughput, you need Standard Access, which requires another review.
- Access to Google Ads accounts you do not own or have not been granted access to. Basic Access is a capability of *your* developer token; it does not change per-account permissions.
- Exemption from Google Ads API policies (rate limits, data usage restrictions, prohibited use cases). All standard policies still apply.
