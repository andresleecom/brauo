# MAP - Brauo Original badge + language default voices (extension v0.10.0)

## Goal
Surface Brauo's own self-hosted voices as a differentiator, and default new users to one of them in
their language. Batches the already-merged cheap-voice-preview work into the v0.10.0 release.

## Behavior
- The voice picker shows a "Brauo Original" badge on voices that carry `badge` from `GET /v1/voices`
  (the API now sets it for self-hosted voices).
- The default voice (when the user has not chosen one) is language-aware and picks a Brauo Original
  (free/self-hosted) voice: Spanish -> Elena, Portuguese -> Bia, everything else -> Milo. This replaces
  the old single default `brauo-luna-es` (a paid voice), so new users start on a good free voice.

## Non-goals
- No new network calls; the badge comes from the existing `/v1/voices` response.
- No change to gating/pricing; paid users still see every voice.

## Decisions
- D01 Default is based on `navigator.language` (the user's browser language), applied in
  `brauoNormalizeConfig` so it flows to the reader, options, and service worker.
- D02 The badge is rendered from the voice object's `badge` field (kept through `listVoices` and the
  bundled fallback), appended to the option label ("Elena · Brauo Original").
- D03 Ship as v0.10.0; the CHANGELOG keeps the existing 0.9.0 entry and adds 0.10.0.

## Constraints
- MV3, plain JS, no build step. Public repo: `brauo-*` ids, neutral copy, no provider names
  ("Brauo Original" is a brand label, not a provider name).
- Verify: `node --check` each touched JS; manifest 0.10.0; CHANGELOG 0.10.0.

## Tasks
| # | Scope | Files | Verify |
|---|-------|-------|--------|
| 01 | Badge rendering + carry badge + language default + version/changelog | shared.js, background.js, voices.js, manifest.json, CHANGELOG.md | `node --check`; version/changelog; diff review |

## Release (orchestrator, outward-facing - needs Andres OK)
Tag `v0.10.0` -> `.github/workflows/release.yml` (this release includes the v0.9.0 cheap-preview work).
