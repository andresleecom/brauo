# MAP-18 - Extension popup: account status + read + simple onboarding

Tier: S. Repo: brauo. Branch: map/popup-account from main.
Andres: clicking the icon should open a small popup that shows account status
(plan, credits) and lets the user read the page, upgrade, and set up. Keep it
VERY simple. v1 onboarding is paste-the-key (Connect-without-paste is a later MAP).

## Goal

Add a minimal toolbar popup. Signed in (key set): show plan + credits left and a
"Read this page" button, plus links to the account (brauo.com) and Options.
Not set up (no key): a "Create free account" button (opens brauo.com) and a field
to paste the API key. Reading now starts from the popup (the icon opens the popup
instead of activating directly).

## Non-goals

- No new API. Uses the existing `GET /v1/account` (returns plan, credits, key
  prefix) and the reader injection from MAP-15.
- No Connect-without-paste (externally_connectable) - that is the next MAP.
- No full tutorial - at most a one-line "How it works" link.
- Keep it minimal: a small card, brand colors, system font. Do not over-build.

## Decision register

- D01 Entry: `action.default_popup = "popup.html"`. Because a popup is set,
  `chrome.action.onClicked` no longer fires, so its handler is removed from
  background.js; the popup's "Read this page" button now injects the reader into
  the active tab (the same idempotent activeTab flow).
- D02 Account data: the popup fetches `GET {baseUrl}/v1/account` with the stored
  cloud key directly (the popup is an extension page with host access). It shows
  `plan` and `credits` (credits remaining; the API does not expose "used").
- D03 Onboarding v1: paste-the-key, guided by the popup. "Create free account"
  opens `https://brauo.com`; the popup has an API key field + Save.
- D04 Version 0.5.0 -> 0.6.0.

## Tasks

| NN | Executor | Scope (files) | Change | Verify bar | Proof |
|----|----------|---------------|--------|------------|-------|
| 01 | codex | `manifest.json`, `background.js`, `popup.html` (new), `popup.js` (new), `CHANGELOG.md` | Add the popup per D01-D04; remove the dead onClicked handler; bump to 0.6.0. | `node --check` all JS; manifest has `action.default_popup` = popup.html and version 0.6.0; no `chrome.action.onClicked` left. | node/JSON + diffs |

## Verify bar (plan level)

- All JS parses; manifest valid with default_popup + 0.6.0.
- Orchestrator renders the popup (setup state) headlessly for a visual brand check.
- Rebuild `brauo-0.6.0.zip`; after merge, tag `v0.6.0` (with Andres's go).
