# MAP-19 - Reader reliability (the "buffer")

Tier: M. Repo: brauo. Branch: map/reader-reliability from main.
Origin: tester quality report (docs/quality-report-testers-2026-07.md), Theme A -
issues #2 (silent/timeout, no feedback), #3 (stops mid-page, no recovery), #8
(no offline handling). Andres flagged this as the "buffer". Also folds in #5
(voice switching mid-playback desync) - same playback engine, confirmed by a dev.

## Goal

Make a reading session survive transient failures instead of dying on the first
failed block. Add a per-request timeout, retry a failed block with backoff, keep
the position so the user can resume, distinguish fatal errors (missing key, quota)
from transient ones (network/offline/5xx), show clear actionable status, and add a
loading indicator.

## Non-goals

- No speed range (#6) here - separate follow-up.
- No local audio cache / offline playback of cached audio (a bigger feature; only
  detect offline and message + resume).
- No change to the popup, brand, provider, or the activeTab entry.

## Decision register

- D01 Per-request timeout: `background.js` wraps each audio fetch in an
  AbortController that aborts after 15s, so a hung request fails cleanly and is
  retried by the existing `fetchWithRetry`.
- D02 Error codes reach the reader: `ttsChunk` attaches `err.code` from the
  service-worker response so `content.js` can classify failures.
- D03 Resilient playback loop (`content.js` `playFrom`): on a block failure,
  - if the error is fatal (NO_KEY, invalid_key, quota_exceeded, voice_not_found,
    text_too_long, invalid_provider): show its message, stop, set play to resume
    (▶). Do not retry (retrying will not help).
  - otherwise (network/timeout/5xx/429): retry the block up to 3 times with
    backoff, showing "Reconnecting…" or the offline message; if it still fails,
    pause WITHOUT losing `idx`, set play to ▶, and show an actionable message
    ("Press ▶ to resume" / offline variant). Never silently kill the session.
  - `idx` is preserved so the existing play button resumes from the failed block.
- D04 Loading indicator: a small celeste spinner in the bar shown while audio is
  being generated or a retry is in flight.
- D05 Offline detection via `navigator.onLine`.
- D06 Version 0.6.0 -> 0.7.0.
- D07 Voice switch during playback (#5): changing the voice while reading clears
  stale prefetched audio and restarts the current block in the new voice (the old
  audio is stopped by `playFrom`'s `stopAll`), so streams never overlap and the
  same paragraph is re-read. When not playing, it just updates the voice.

## Tasks

| NN | Executor | Scope (files) | Change | Verify bar | Proof |
|----|----------|---------------|--------|------------|-------|
| 01 | codex | `background.js`, `content.js`, `content.css`, `manifest.json`, `CHANGELOG.md` | Timeout (D01), code propagation (D02), resilient loop + spinner + offline (D03-D05), bump 0.7.0. | `node --check` all JS; manifest version 0.7.0; content.js has the retry/resume path (no bare `playing = false; break;` on the first failure). | node/JSON + diffs |

## Verify bar (plan level)

- All JS parses; manifest 0.7.0.
- Orchestrator reads the diff to confirm the loop retries and preserves `idx`, and
  renders the bar with a spinner state if practical.
- Rebuild `brauo-0.7.0.zip`; after merge, tag `v0.7.0` (with Andres's go).
- Live smoke (Andres or a follow-up QA): read a long page; simulate offline
  (DevTools) mid-read and confirm it pauses with a clear message and resumes.
