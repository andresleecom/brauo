# MAP - Cheap voice preview (stop re-charging on voice switch)

## Goal
Switching voice must be cheap so users can compare voices without burning paid credits. Today, changing
the reader's voice while reading calls `cache.clear(); playFrom(idx)`, which re-synthesizes (and
re-charges) the whole current paragraph in the new voice - a user testing three voices re-charged the
same blocks three times (verified in prod usage_events).

## Behavior (agreed)
- **Reading + switch voice:** apply the new voice to upcoming blocks only. Drop the stale-voice prefetch
  so the next block is synthesized in the new voice; the current block finishes in the previous voice.
  No re-read of the current block, so no re-charge.
- **Idle + switch voice:** play a short, fixed preview sample in the new voice (cheap, ~1 sentence), so
  voices can be A/B compared on identical text without reading the page.

## Non-goals
- No server/API change; the metering itself is correct (each miss bills its own chars).
- No change to the Options page (its Preview already plays a cheap fixed sample).

## Decisions
- D01 A shared constant `BRAUO_PREVIEW_SAMPLE` (short sentence) is the preview text.
- D02 The preview uses its own audio element and never disturbs a reading session; starting a read stops
  a playing preview.
- D03 Ship as extension v0.9.0 (behavior change) with a CHANGELOG entry.

## Constraints
- MV3, plain JS, no build step. Public repo: only `brauo-*` ids, neutral copy, no provider names.
- CHANGELOG rule: shipping a version is the implicit ask for its notes (flag to Andres).
- Verify: `node --check` each touched JS; manifest 0.9.0; CHANGELOG 0.9.0.

## Tasks
| # | Scope | Files | Verify |
|---|-------|-------|--------|
| 01 | Cheap voice switch (no re-read) + idle preview + version/changelog | shared.js, content.js, manifest.json, CHANGELOG.md | `node --check`; version/changelog; diff review |

## Release (orchestrator, outward-facing - needs Andres OK)
Tag `v0.9.0` -> `.github/workflows/release.yml`.
