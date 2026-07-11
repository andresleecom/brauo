# Task 05: Manifest permissions and metadata, README dual-mode rewrite

## Goal
manifest.json allows the Brauo API origin and carries provider-neutral metadata plus the 0.2.0 version bump.
README.md documents both voice services without leaking anything private.

## Context - read these first
- manifest.json - host_permissions, name, description, version.
- README.md - current Deepgram-only copy.
- options.html / options.js / content.js - the dual-mode UX this README must describe (mode radios, separate keys, cloud key on this device only, Advanced base URL, explicit Save).
- Public-repo rules: no keys of any kind, no pricing or margins, and never say what runs behind Brauo Cloud voices. The Deepgram brand may appear only in the bring-your-own-key path.

## Scope - you may edit
- manifest.json, README.md

## Out of scope - do not touch
- All .js files, options.html, content.css, LICENSE, icons/

## Steps
1. manifest.json: host_permissions becomes ["https://api.deepgram.com/*", "https://api.brauo.com/*"]. name: "Brauo - Read Aloud". description: "Point at any paragraph, click, and listen. Natural text to speech for any page, with Brauo Cloud voices or your own Deepgram key." version: "0.2.0". Change nothing else.
2. README.md rewrite, keeping the friendly tone and the existing sections that still apply:
   - Intro: Brauo reads any page aloud; voices come from Brauo Cloud (paste one key in Options) or from your own Deepgram account.
   - Keep "How it works" and "Install (unpacked)" essentially as they are.
   - New "Choose a voice service" section. Brauo Cloud: pick it in Options, paste your brauo_sk key, Save; the key is stored only on this device (chrome.storage.local); Brauo Cloud is in early access, so keys are issued manually for now; repeated text is served from the service cache, so re-reading is fast. Deepgram: the current copy (free key at console.deepgram.com, stored in your browser, billed by characters).
   - Configuration table updated: Voice service, Brauo Cloud API key (this device only), Deepgram API key, Default voice per service, Speed, Advanced API base URL (leave empty for the default).
   - Privacy: the text of blocks you read is sent only to the voice service you selected (api.brauo.com in Brauo Cloud mode, api.deepgram.com in Deepgram mode); keys never leave your browser except to authenticate with that service; no analytics, no tracking.
   - Notes: mention 0.2.0 adds Brauo Cloud mode alongside the original bring-your-own-key mode; keep the MV3 no-build note.
   - Keep Roadmap and License as they are.
3. Markdown style: every full sentence on its own line; no em dashes anywhere; English only. Do not add a smoke-test section (a later task adds it).

## Verify before reporting
Run: `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`
Also confirm with a grep that README.md contains no "brauo_sk_" followed by anything other than a placeholder ellipsis and no Deepgram mention inside the Brauo Cloud parts.
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
