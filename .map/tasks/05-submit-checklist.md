# Task 05: Chrome Web Store submission checklist

## Goal
store/SUBMIT.md walks Andres through the entire submission in one sitting: package, every dashboard tab, ready-to-paste listing copy in English and Spanish, permission justifications, and what happens after submit.
Everything pasteable must be final copy, not placeholders.

## Context - read these first
- PRIVACY.md, README.md, CHANGELOG.md, manifest.json, _locales/ - the source of truth for names, descriptions, and claims. Never contradict them.
- store/ holds promo-440x280.png and two 1280x800 screenshots (plus their sources).
- Public repo rules: no keys, no margins, no provider names in anything Brauo Cloud.
- Package contents are frozen: manifest.json, background.js, content.js, content.css, options.html, options.js, shared.js, voices.js, icons/, _locales/. Nothing else goes in the zip.

## Scope - you may edit
- store/SUBMIT.md (new)

## Out of scope - do not touch
- Everything else.

## Steps
Write store/SUBMIT.md with these sections, in order:
1. Prerequisites: Chrome Web Store developer account (one-time 5 USD fee), and the privacy policy URL. Use https://github.com/andresleecom/brauo/blob/main/PRIVACY.md for now and note swapping to https://brauo.com/privacy once that page exists.
2. Build the package: exact commands for Git Bash (zip) and PowerShell (Compress-Archive) that produce brauo-0.2.1.zip containing exactly the frozen file list above; remind that _locales must be inside.
3. Store listing tab: title (Brauo - Read Aloud), summary under 132 characters in en and es, full description in en and es (write final marketing copy consistent with the README: point-click-listen, works on any page, voices from Brauo Cloud with one key or your own Deepgram key, privacy-respecting, open source link), category Accessibility, both languages configured.
4. Graphic assets: store icon = icons/icon128.png, screenshots = the two 1280x800 PNGs in store/ (upload order and captions in en and es), small promo tile = store/promo-440x280.png.
5. Privacy tab, ready to paste: single purpose statement (reads aloud the text of pages the user chooses); permission justifications for storage, host api.brauo.com, host api.deepgram.com, and the content script on all sites (user can invoke reading on any page; the extension only acts when clicked; no browsing data is collected); remote code: none; data usage form: check Website content (text the user chooses to read) and Authentication information (user-provided API keys), certify Limited Use compliance; privacy policy URL from section 1.
6. Reviewer notes box, ready to paste: explain the bubble entry point and that cloud mode needs an API key; if the reviewer requests test credentials, issue a temporary Brauo Cloud key and revoke it after review (never publish one).
7. After submit: typical review times, how to answer a rejection using the justifications above, and the planned follow-up: switching to an action button with activeTab in a future update is a permission reduction and safe after publish (link nothing, just state it).
8. Re-taking screenshots: node store/render-assets.mjs regenerates everything; manual alternative documented in two lines (1280x800 window, read a real page with a key configured for a live "Reading N / M" capture).
Style: English, no em dashes, every sentence on its own line, checkbox lists where natural.

## Verify before reporting
Run: `grep -c "brauo_sk_" store/SUBMIT.md || true` (expect 0) and `grep -n -i "deepgram" store/SUBMIT.md | head -5` (must appear only in BYO context lines).
Paste the outputs in your REPORT under PROOF.

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
