# Task 03: Provider layer (Deepgram + Brauo Cloud) in the service worker

## Goal
background.js exposes two providers behind one interface: `speak(text, voice, cfg)` and `listVoices(cfg)`.
DeepgramProvider wraps the current code; BrauoCloudProvider talks to the Brauo API.
The tts response gains `mime` (and `cache` when the API reports it); the content script keeps working unchanged.

## Context - read these first
- background.js - current speak/fetchCatalog/message handlers.
- shared.js - constants live here; extend it.
- voices.js - bundled Deepgram fallback catalog; add the cloud one next to it.
- Live cloud contract, verified against production (do not invent fields):
  - GET {base}/v1/voices is public (no auth): `{"voices":[{"id":"brauo-luna-es","display_name":"Luna","language":"es-CO","tier":"pro"},{"id":"brauo-nova-en","display_name":"Nova","language":"en-US","tier":"pro"}]}`
  - POST {base}/v1/speak with headers `Authorization: Bearer <key>`, `Content-Type: application/json`, body `{"text","voice","format":"mp3","cache":true}` returns audio bytes; response headers include `X-Brauo-Cache: hit|miss` and `X-Brauo-Request-Id`.
  - Errors are JSON before any audio: `{"error":{"code":"invalid_key","message":"invalid API key"}}` (401 observed; other codes exist: voice_not_found, quota_exceeded, text_too_long).

## Scope - you may edit
- background.js, shared.js, voices.js

## Out of scope - do not touch
- content.js, options.js, options.html, manifest.json, README.md

## Steps
1. shared.js: add `const BRAUO_CLOUD_API = "https://api.brauo.com";`, `const BRAUO_CLOUD_DEFAULT_VOICE = "brauo-luna-es";`, `const BRAUO_MAX_CHARS = { deepgram: 1800, cloud: 1800 };` and `function brauoNormalizeConfig(sync, local)` returning `{ mode, speed, deepgram: { apiKey, voice }, cloud: { apiKey, voice, baseUrl } }` where: mode is "cloud" only if sync.mode === "cloud" else "deepgram"; deepgram falls back to legacy flat keys (sync.apiKey, sync.model) when sync.deepgram is absent; cloud.apiKey comes from local.cloudApiKey; cloud.voice from sync.cloud.voice or the default; cloud.baseUrl from local.cloudBaseUrl or BRAUO_CLOUD_API. Keep BRAUO_SETTINGS_DEFAULTS for now (content/options still use it).
2. voices.js: append `const BRAUO_CLOUD_FALLBACK_VOICES = [ { model: "brauo-luna-es", name: "Luna", lang: "es-CO" }, { model: "brauo-nova-en", name: "Nova", lang: "en-US" } ];`
3. background.js: replace getSettings() with `getConfig()` = brauoNormalizeConfig(await chrome.storage.sync.get(null), await chrome.storage.local.get({ cloudApiKey: "", cloudBaseUrl: "" })).
4. background.js: add `function brauoError(code, message)` (Error with a `code` property). Define `DeepgramProvider` (current speak fetch and /v1/models mapping; NO_KEY -> brauoError("NO_KEY", "Set your Deepgram API key in Options")) and `BrauoCloudProvider` per the live contract above (speak requires cfg.cloud.apiKey, else NO_KEY with the message "Set your Brauo Cloud API key in Options"; listVoices needs no auth; on !res.ok parse the JSON envelope and throw brauoError(envelope code or "http_" + status, envelope message or a short fallback)). Map cloud voices to the internal shape `{ model: v.id, name: v.display_name || v.id, lang: v.language || "?" }`.
5. speak() of both providers resolves `{ b64, mime, cache? }`: mime from the response Content-Type when it starts with "audio/", else "audio/mp3"; cache from the X-Brauo-Cache header (cloud only, omit when absent).
6. Message handlers: `PROVIDERS = { deepgram: DeepgramProvider, cloud: BrauoCloudProvider }`. For `tts` and `catalog`: resolve `mode = msg.mode || cfg.mode`; per-request overrides, never persisted: msg.key replaces that mode's apiKey, msg.baseUrl replaces cloud baseUrl. Voice: `msg.voice || msg.model || cfg[mode].voice` (msg.model keeps the current content script working). Responses: tts -> `{ ok: true, b64, mime, cache }`; catalog -> stores voices in storage.local under `catalog`/`catalogFetchedAt` for deepgram or `cloudCatalog`/`cloudCatalogFetchedAt` for cloud, then responds `{ ok: true, voices }`. Failures respond `{ ok: false, code: e.code || "error", error: e.message }`. openOptions stays as is.
7. Do not import voices.js into the worker; it is UI-side only. No retry logic yet (a later task adds it). No em dashes in any string.

## Verify before reporting
Run: `node --check background.js && node --check shared.js && node --check voices.js`
Paste the output in your REPORT under PROOF.

HARD RULES - violating any of these means your work is discarded:
- NO git commands of any kind (no commit, branch, push, reset, checkout, stash).
- NO dependency changes: no package installs, no lockfile edits, no tool installs.
- Edit ONLY within the scope listed above. If the fix requires touching anything
  else, STOP and explain in your REPORT instead of doing it.
- If blocked or uncertain, STOP and report - do not improvise around the spec.
- End your output with:
  ## REPORT
  STATUS: done | blocked
  FILES TOUCHED: <list>
  PROOF: <output of the verification commands you were asked to run>
  NOTES: <up to 10 lines: decisions made, anything the reviewer must know>
