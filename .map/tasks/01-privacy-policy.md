# Task 01: Privacy policy for the Chrome Web Store

## Goal
Create PRIVACY.md at the repo root: the privacy policy the Chrome Web Store listing will link to.
It must be accurate for BOTH voice services, provider-neutral in everything Brauo Cloud, and satisfy CWS user-data policy expectations (what is collected, how it is used, sharing, Limited Use).
Add one link line to README.md's Privacy section.

## Context - read these first
- README.md - the existing Privacy section states the current truthful behavior; PRIVACY.md expands it formally. Add the link line there.
- options.html - the copy already promises: cloud key stored only on this device (chrome.storage.local); text goes to the selected voice service.
- Facts you must state accurately (do not invent beyond these):
  - The extension sends ONLY the text of blocks the user chooses to read, plus the selected voice id, to the selected voice service: api.brauo.com (Brauo Cloud mode) or api.deepgram.com (bring-your-own-Deepgram mode). Nothing is sent until the user starts reading.
  - API keys are stored in the browser (chrome.storage; the Brauo Cloud key only in chrome.storage.local on the device) and are sent only to authenticate with the selected service.
  - The extension itself collects NO analytics, NO tracking, NO browsing history, NO ads, and sells nothing.
  - Brauo Cloud processes text solely to synthesize audio; it records usage metadata (request id, character counts, timestamps) for quotas and billing, and may cache generated audio keyed by a one-way fingerprint of text plus voice so repeated reads are fast. Page URLs are not sent.
  - Brauo Cloud may rely on third-party speech and infrastructure providers to synthesize audio; never name any provider in the cloud sections.
  - In Deepgram mode, text goes directly to Deepgram under the user's own account and Deepgram's own privacy terms; naming Deepgram is allowed only in that section.
  - Uninstalling the extension removes everything it stored in the browser.
  - Contact: hola@andreslee.com. Effective date: 2026-07-11.

## Scope - you may edit
- PRIVACY.md (new), README.md (only adding one line to the Privacy section)

## Out of scope - do not touch
- Everything else (all .js, manifest.json, options.html, LICENSE, icons/).

## Steps
1. Write PRIVACY.md with these sections: What Brauo does; What data is processed and when; Where your text goes (one subsection per service, cloud first); API keys; What Brauo does not do; Data retention (cloud cache + usage metadata; nothing retained by the extension itself); Limited Use (data used solely to provide the read-aloud purpose, never sold, never used for advertising or creditworthiness, consistent with the Chrome Web Store User Data Policy including its Limited Use requirements); Changes to this policy; Contact.
2. Keep it short and plain-language (target 60-90 lines). Every full sentence on its own line. No em dashes. English.
3. README.md Privacy section: append the line `See [PRIVACY.md](PRIVACY.md) for the full privacy policy.`

## Verify before reporting
Run: `grep -c "sk_" PRIVACY.md || true` (expect 0) and confirm no provider name appears in any Brauo Cloud section (grep -n -i deepgram PRIVACY.md must only match the bring-your-own-key section).
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
