# MAP-14 - Extension goes Brauo Cloud only (remove Deepgram)

Tier: M. Repo: brauo (public extension). Branch: map/extension-cloud-only from main.
Goal set by Andres: the extension must talk ONLY to our own API; strip Deepgram.

## Goal

Remove every Deepgram code path so the extension is a pure Brauo Cloud client
(`https://api.brauo.com`). The user authenticates by pasting their Brauo API key
(`brauo_sk_...`) in Options; the free tier is the on-ramp. Then update docs,
locales and the store package, and bump to 0.3.0.

## Non-goals

- No in-extension OIDC/Keycloak login this MAP (paste-the-key stays). Future MAP.
- No change to the reading UX, prefetch, highlight, or floating bar behavior.
- No provider names or margins anywhere (public repo stays neutral - now trivially
  true since the only host is api.brauo.com).

## Decision register

- D01 Deepgram is fully removed. There is no `mode` concept anymore; Brauo Cloud
  is the only provider.
- D02 Auth = paste `brauo_sk` API key, stored in `chrome.storage.local`
  (`cloudApiKey`). Options points users to https://brauo.com for a free key.
- D03 Config shape simplifies to `{ speed, cloud: { apiKey, voice, baseUrl } }`.
  `BRAUO_MAX_CHARS` becomes a single number (1800).
- D04 Version 0.2.1 -> 0.3.0 (breaking: bring-your-own-Deepgram removed).
- D05 Options UI: one Brauo section (API key, default voice, Advanced service
  URL, speed, save). No mode radios, no Deepgram section.
- D06 Docs/locales/store rewritten to Cloud-only; privacy simplifies to a single
  data recipient (Brauo Cloud).

## Tasks

| NN | Scope (files) | Change | Verify bar | Proof |
|----|---------------|--------|------------|-------|
| 01 | `manifest.json`, `shared.js`, `background.js`, `content.js`, `voices.js`, `options.html`, `options.js` | Strip Deepgram; Cloud-only per D01/D03/D05; manifest host = api.brauo.com only, version 0.3.0. | `node --check` on every JS file; `manifest.json` valid JSON with only `https://api.brauo.com/*`; NO case-insensitive match for `deepgram` or `aura` in these 7 files. | node/JSON output + grep result + diffs |
| 02 | `README.md`, `PRIVACY.md`, `CHANGELOG.md`, `_locales/en/messages.json`, `_locales/es/messages.json`, `store/SUBMIT.md` | Rewrite copy to Cloud-only, neutral; add 0.3.0 changelog; privacy = single recipient (Brauo Cloud); store permission justification = only `storage` + `api.brauo.com`. | Both locale JSON files valid; NO `deepgram`/`aura` (case-insensitive) anywhere in the repo except CHANGELOG history lines that describe the removal. | grep result + diffs |

## Verify bar (plan level)

- All JS parses (`node --check`), both locale JSON and manifest are valid.
- `grep -ri "deepgram\|aura\|api.deepgram" .` (excluding `.git`, `.map`) returns
  nothing except an allowed CHANGELOG line noting the removal.
- Manual live smoke (Andres/orchestrator): load unpacked, paste a real brauo_sk
  key, read a page - audio comes from api.brauo.com. Recorded, not codex's job.
