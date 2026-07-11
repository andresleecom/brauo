# Task 03: _locales en + es and manifest store fields

## Goal
The manifest name and description become localized (English default, Spanish), and the manifest gains the store-facing fields: icon 32, homepage_url, version 0.2.1.
Zero behavior change.

## Context - read these first
- manifest.json - current name "Brauo - Read Aloud" and description; those exact English strings move into _locales/en.
- icons/icon32.png exists (generated in the previous task) and must be referenced.

## Scope - you may edit
- _locales/en/messages.json (new), _locales/es/messages.json (new), manifest.json

## Out of scope - do not touch
- Everything else.

## Steps
1. _locales/en/messages.json:
   - appName: "Brauo - Read Aloud"
   - appDesc: the current manifest description string, verbatim.
   Each with a short "description" field for translators context.
2. _locales/es/messages.json (proper Spanish with correct accents, UTF-8, no em dashes):
   - appName: "Brauo - Lectura en voz alta"
   - appDesc: "Apunta a un párrafo, haz clic y escucha. Texto a voz natural para cualquier página, con voces de Brauo Cloud o tu propia clave de Deepgram."
3. manifest.json:
   - "name": "__MSG_appName__", "description": "__MSG_appDesc__", "default_locale": "en"
   - "version": "0.2.1"
   - icons gains "32": "icons/icon32.png" (keep 16/48/128)
   - "homepage_url": "https://github.com/andresleecom/brauo"
   - Nothing else changes: no "action" key, permissions and content_scripts stay exactly as they are.

## Verify before reporting
Run: `node -e "for (const f of ['manifest.json','_locales/en/messages.json','_locales/es/messages.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); console.log(f, 'ok'); }"`
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
