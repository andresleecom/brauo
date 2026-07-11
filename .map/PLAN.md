# MAP: Brauo Cloud mode in the public extension (E1)

**Goal:** With the Cloud toggle on and a brauo_sk_* key pasted in Options, the extension reads a full page via https://api.brauo.com (no Deepgram key needed), with the voice catalog from GET /v1/voices and audio from POST /v1/speak; Deepgram BYO mode keeps working; the public repo ships no secrets and no provider mapping in cloud copy.
**Base:** main @ 32b0ded · **Branch:** map/brauo-cloud · **Tier:** M
**Non-goals:** Chrome Web Store submission, signup/OAuth, offscreen document, Firefox port, embedding any platform key, changes to brauo-api.

## Decisions
- D01 Dual mode: `deepgram` | `cloud`; default `deepgram` so existing installs keep working.
- D02 Cloud base URL default https://api.brauo.com; overridable in Options (Advanced) for local gateways.
- D03 Cloud key lives only in chrome.storage.local (never sync).
- D04 Deepgram key stays in chrome.storage.sync (BYO, as today).
- D05 host_permissions gains https://api.brauo.com/*.
- D06 Provider interface in background: speak(text, voiceId), listVoices().
- D07 Content audio cache keyed by hash(text+voice), not block index.
- D08 No provider brand in Cloud UI copy ("Brauo Cloud", voice display names only).
- D09 Keys persist only on explicit Save; preview/catalog refresh pass the key as a per-request override, never storing it.
- D10 Chunking stays paragraph-level; MAX_CHARS 1800 for both providers (cloud M0 limit ~2000).
- D11 Storage schema. sync: { mode, speed, deepgram: {apiKey, voice}, cloud: {voice} }; local: { cloudApiKey, cloudBaseUrl, catalog, cloudCatalog }. One-time migration moves legacy {apiKey, model} into the deepgram slot and removes the legacy keys.
- D12 Worker to content contract: {ok:true, b64, mime, cache?} | {ok:false, code, error}. Messages: tts {text, voice, mode?, key?, baseUrl?}, catalog {mode?, key?, baseUrl?}; overrides are per-request only (for Options preview) and never persisted.
- D13 Live cloud contract (verified 2026-07-11 against production): GET /v1/voices is public, returns {voices:[{id, display_name, language, tier}]}, no sample URLs yet. Errors: {error:{code,message}} (e.g. invalid_key with 401). POST /v1/speak takes Bearer + {text, voice, format:"mp3", cache:true}; useful headers X-Brauo-Request-Id, X-Brauo-Cache: hit|miss.
- D14 Bundled cloud fallback catalog in voices.js: brauo-luna-es (Luna, es-CO) and brauo-nova-en (Nova, en-US).

## Constraints
- Public repo: never commit keys (brauo_sk_*, Deepgram), margins, or any voice-to-provider mapping; the Deepgram name appears only in the BYO path.
- Plain MV3: no build step, no dependencies, no frameworks; match the existing vanilla style and comment density.
- English in all code and README; no em dashes anywhere (use plain dashes).
- Executor: no git, no dependency changes, scope only.

## Verify commands
- Syntax: `node --check shared.js && node --check background.js && node --check content.js && node --check options.js && node --check voices.js`
- Manifest: `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"`
- Secrets grep: `git grep -nE "brauo_sk_[A-Za-z0-9]{8,}"` and a review pass over diffs; zero hits allowed.
- Flow: load unpacked; Options: Cloud mode + smoke key (never committed); read a long article; network shows only api.brauo.com in cloud mode; second play of the same text benefits from the API cache; Deepgram BYO regression check.

## Tasks
| # | Task | Scope (files/areas) | Bar | Status |
|---|------|---------------------|-----|--------|
| 01 | Shared constants/defaults module; dedupe settings defaults + voice select rendering | shared.js (new), manifest.json (js list only), background.js, content.js, options.js, options.html | build | done |
| 02 | Content audio cache keyed by hash(text+voice); insertion-order eviction; drop rejected entries so the next attempt retries | content.js | build | done |
| 03 | Provider layer in background: DeepgramProvider + BrauoCloudProvider behind speak/listVoices; {ok,b64,mime,cache} contract; cloud fallback catalog | background.js, shared.js, voices.js | build | done |
| 04 | Storage migration to dual-mode schema; Options mode/keys UI with explicit Save; mode-aware content bar | background.js, options.html, options.js, content.js, shared.js | build+flow | done |
| 05 | manifest host_permissions + neutral name/description + version 0.2.0 + README dual-mode rewrite | manifest.json, README.md | review | done |
| 06 | Retry/backoff for 429/5xx/network + cloud error code messages + E1 smoke checklist in README | background.js, shared.js, README.md | build+flow | pending |

Bar legend: build = diff review + node --check · review = diff review + docs read · +flow = also drive the affected flow.

Status values: `pending` · `done` · `blocked` · `takeover`.
