# Task 01: Shared constants/defaults module

## Goal
Create shared.js, a plain-script module loaded by the service worker, the content script, and the options page.
It holds the settings defaults and the voice-select rendering that are currently duplicated (defaults in 4 places, renderer in 2).
Zero behavior change.

## Context - read these first
- background.js - getSettings() duplicates the defaults object.
- content.js - `let settings = {...}` near the top, storage.sync.get defaults near line 149, langLabel + renderVoices near lines 60-97.
- options.js - storage.sync.get defaults near line 106, langLabel + renderVoices near lines 6-48.
- voices.js - the pattern to follow: plain global const, no modules, no exports.
- manifest.json (content_scripts js array) and options.html (script tags) are the load points.

## Scope - you may edit
- shared.js (new), manifest.json, background.js, content.js, options.js, options.html

## Out of scope - do not touch
- voices.js, content.css, README.md, LICENSE, icons/

## Steps
1. Create shared.js in the existing vanilla style (globals, no export, no document access at top level, because the service worker imports it):
   - `const BRAUO_SETTINGS_DEFAULTS = { apiKey: "", model: "aura-2-celeste-es", speed: "1" };`
   - `function brauoLangLabel(lang)`: move the identical langLabel implementation here.
   - `function brauoRenderVoiceOptions(sel, voiceList, selected, opts)`: unified renderer. Clears sel, groups voices by brauoLangLabel(v.lang) into optgroups sorted by label, options sorted by name. Option text is v.name, or v.name + " - " + v.accent when opts && opts.withAccent && v.accent (plain dash, never an em dash). If `selected` is not among the options, append it as a bare option; when `selected` is given, set sel.value to it.
2. Load it everywhere: manifest content_scripts js becomes ["shared.js", "voices.js", "content.js"]; options.html loads shared.js before voices.js and options.js; background.js starts with importScripts("shared.js").
3. Replace all four hardcoded default objects with BRAUO_SETTINGS_DEFAULTS. In content.js the initial value becomes `let settings = { ...BRAUO_SETTINGS_DEFAULTS };`. chrome.storage.sync.get can take BRAUO_SETTINGS_DEFAULTS directly.
4. Rewrite both renderVoices functions to delegate to brauoRenderVoiceOptions. options.js keeps withAccent: true and its voiceCount hint line; content.js keeps choosing between catalog and BRAUO_FALLBACK_VOICES. Delete both local langLabel copies.
5. If any string you touch contains an em dash, replace it with a plain dash. Do not touch manifest name/description or host_permissions in this task.
6. Match existing comment density; do not add explanatory comments about the refactor.

## Verify before reporting
Run: `node --check shared.js && node --check background.js && node --check content.js && node --check options.js && node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`
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
