# Task 04: Dual-mode storage migration, Options UI, mode-aware content bar

## Goal
The extension becomes dual mode. sync holds { mode, speed, deepgram: {apiKey, voice}, cloud: {voice} }; storage.local holds { cloudApiKey, cloudBaseUrl } (a Brauo Cloud key must never reach sync).
A one-time migration moves the legacy flat {apiKey, model} into the deepgram slot.
Options gets a mode selector with separate key fields and voice pickers; keys persist only on explicit Save.
The floating bar uses the active mode's voice list and key.

## Context - read these first
- shared.js - brauoNormalizeConfig, BRAUO_CLOUD_DEFAULT_VOICE, BRAUO_MAX_CHARS (from task 03); BRAUO_SETTINGS_DEFAULTS is now legacy.
- background.js - getConfig(), providers, message handlers with per-request overrides {mode, key, baseUrl} (task 03).
- content.js, options.js, options.html - current single-mode UI.
- voices.js - BRAUO_FALLBACK_VOICES (deepgram) and BRAUO_CLOUD_FALLBACK_VOICES.

## Scope - you may edit
- background.js, content.js, options.js, options.html, shared.js

## Out of scope - do not touch
- voices.js, manifest.json, README.md, content.css

## Steps
1. shared.js: add `const BRAUO_DEEPGRAM_DEFAULT_VOICE = "aura-2-celeste-es";`, use it inside brauoNormalizeConfig, and delete BRAUO_SETTINGS_DEFAULTS once nothing references it.
2. background.js: add `async function migrateStorage()` called once at top level. If sync storage still has "apiKey" or "model" keys: write { mode: existing or "deepgram", deepgram: existing or { apiKey: legacy apiKey or "", voice: legacy model or BRAUO_DEEPGRAM_DEFAULT_VOICE }, cloud: existing or { voice: BRAUO_CLOUD_DEFAULT_VOICE } }, then remove ["apiKey", "model"]. Idempotent, no-op after first run.
3. content.js: replace `settings` with `let cfg = brauoNormalizeConfig({}, {});` plus raw snapshots `lastSync`/`lastLocal`. Load with chrome.storage.sync.get(null) and chrome.storage.local.get({ cloudApiKey: "", cloudBaseUrl: "", catalog: null, cloudCatalog: null }), then normalize. Keep `catalog` and add `cloudCatalog`. In chrome.storage.onChanged (both areas) apply the changes to the snapshots, re-normalize into cfg, and re-render voices when mode, catalogs, or the active voice changed from outside.
4. content.js mode-aware behavior:
   - Active voice is `cfg[cfg.mode].voice`; use it for renderVoices selection, the tts message, and both cacheKey call sites.
   - Voice list: cloud mode uses cloudCatalog when non-empty else BRAUO_CLOUD_FALLBACK_VOICES; deepgram mode uses catalog else BRAUO_FALLBACK_VOICES.
   - Bar voice change persists only the active mode's slot: cloud -> chrome.storage.sync.set({ cloud: { voice } }); deepgram -> chrome.storage.sync.set({ deepgram: { ...cfg.deepgram, voice } }) so the stored apiKey survives.
   - MAX_CHARS becomes BRAUO_MAX_CHARS[cfg.mode] (drop the local const).
   - tts message: { type: "tts", text, voice: activeVoice }. ttsChunk resolves { b64: resp.b64, mime: resp.mime }; playB64 becomes playPart(part) building "data:" + (part.mime || "audio/mp3") + ";base64," + part.b64. Remove the `err === "NO_KEY"` special case (background now sends final messages).
   - Missing-key hint on bubble click, by mode: cloud checks cfg.cloud.apiKey and says "Set your Brauo Cloud API key in Options ⚙"; deepgram keeps the current message checking cfg.deepgram.apiKey.
5. options.html: keep the card style, add a "Voice service" radio row (Brauo Cloud / Deepgram with your own key) and two sections toggled by it.
   - #cloudSection: password input #cloudKey (placeholder "brauo_sk_...") with Show toggle; hint "Stored only on this device (chrome.storage.local)."; select #cloudVoice + button #cloudPreview; button #cloudRefresh "Load voices"; hint #cloudVoiceCount; a details/summary "Advanced" holding text input #cloudBaseUrl with placeholder https://api.brauo.com and hint "Leave empty for the default service.". No provider brand names anywhere in this section.
   - #deepgramSection: the existing Deepgram fields keep their ids (apiKey, toggleKey, voice, preview, refresh, voiceCount) and copy.
   - Shared below both: speed select, Save button, status. Update the page subtitle to "Read any page aloud with natural voices." and the footer to say text goes to the voice service you select (Brauo Cloud or your own Deepgram account). Add the minimal CSS for radios and details in the existing style.
6. options.js: rewrite around the new schema.
   - Load sync.get(null) + local.get as in content.js, normalize, fill both key fields, base URL (raw stored value, may be empty), speed, radio, and render both voice selects (deepgram from catalog else BRAUO_FALLBACK_VOICES with withAccent: true; cloud from cloudCatalog else BRAUO_CLOUD_FALLBACK_VOICES). Radio change only toggles section visibility.
   - Save (single button) persists everything at once: sync.set({ mode, speed, deepgram: { apiKey, voice }, cloud: { voice } }) + local.set({ cloudApiKey, cloudBaseUrl }); status "Saved ✓". This is the only place keys are written; delete the old auto-saves inside refresh/preview.
   - Deepgram refresh: needs the key field, sends { type: "catalog", mode: "deepgram", key } and re-renders from the response. Cloud "Load voices": sends { type: "catalog", mode: "cloud", baseUrl: field value or undefined }, no key needed.
   - Previews never persist anything: deepgram plays v.sample when present, else needs the key field and sends { type: "tts", mode: "deepgram", voice, key, text: preview phrase }; cloud always synthesizes with { type: "tts", mode: "cloud", voice, key: cloud key field, baseUrl } and shows "Enter your API key to preview voices." when the field is empty. Play using resp.mime like the content script.
7. No em dashes in any string. English only. Match existing comment density.

## Verify before reporting
Run: `node --check shared.js && node --check background.js && node --check content.js && node --check options.js`
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
