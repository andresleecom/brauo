# Task 04: CHANGELOG and store-oriented README install section

## Goal
CHANGELOG.md records the three versions that exist, and the README points at the coming store listing while keeping the unpacked path for developers.

## Context - read these first
- README.md - Install (unpacked) section and the Notes section (its "Version 0.2.0 adds..." line moves conceptually into the changelog).
- manifest.json - version is 0.2.1 (or will be within this branch; write the changelog for it regardless).
- Version history facts: 0.1.0 (July 2026) initial release, point-and-click read aloud with Deepgram voices, bring your own key. 0.2.0 (2026-07-11) Brauo Cloud mode: dual voice services, cloud key on-device, per-service voices, audio cache keyed by text plus voice, retry with backoff, api.brauo.com host permission, provider-neutral cloud UI. 0.2.1 (2026-07-11) store packaging only: localized name and description (en, es), icon 32, homepage_url, privacy policy, store assets and submission docs; no behavior changes.

## Scope - you may edit
- CHANGELOG.md (new), README.md

## Out of scope - do not touch
- Everything else.

## Steps
1. CHANGELOG.md in Keep a Changelog spirit but minimal: title, one section per version (newest first) with date and 3-6 bullet lines each, drawn from the facts above. No em dashes, English, each sentence on its own line.
2. README.md:
   - Rename the install heading to "Install" with two subsections: "From the Chrome Web Store" (one line: coming soon, the listing link will land here once published) and "Unpacked (developers)" keeping the current steps.
   - In Notes, replace the "Version 0.2.0 adds..." line with: `See [CHANGELOG.md](CHANGELOG.md) for version history.`
   - Change nothing else in the README.

## Verify before reporting
Run: `grep -n "CHANGELOG" README.md && head -5 CHANGELOG.md`
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
