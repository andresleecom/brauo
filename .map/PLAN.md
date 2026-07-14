# MAP - Free-tier voice filtering (extension, Phase 3b)

## Goal
The extension voice picker shows FREE-plan users only free (Kokoro, `tier: "free"`) voices, and the
reader actually uses a free voice (no server 403). Paid plans and unknown plan keep every voice.
This is the UX half of Phase 3a (the gateway already returns 403 `paid_voice_required` for a free
plan asking a paid voice); here the client never offers a voice it cannot use.

## Non-goals
- No server change. `GET /v1/voices` stays public/unfiltered (the website uses it); filtering is client-side.
- No auto-fetch of the live catalog on reader activation (kept as a follow-up).
- No rewrite of popup's proven account-fetch flow.

## Decisions
- D01 Filtering is CLIENT-side and keyed on the voice `tier` field (live `/v1/voices` returns it: 6 free / 13 pro).
- D02 The user's plan is cached in `chrome.storage.local` as `cloudPlan` by the popup (the guaranteed
  entry point: the icon opens the popup, which fetches `/v1/account`, then "Read this page" injects the reader).
  `content.js` / `options.js` read that cache. No new network call in the reader.
- D03 A free user whose selected/default voice is not free is snapped to the first free voice and the
  choice is persisted (the default `brauo-luna-es` is a paid voice). Snap only runs for plan `free`.
- D04 The bundled fallback catalog (`voices.js`, used before the live catalog loads) gains `tier` and
  includes free voices, so the filter is correct even offline / pre-refresh.
- D05 Fold in the deferred `popup.js` fix: "Account" link `brauo.com/cuenta` -> `/account`.
- D06 Free-user "upgrade" hint (link to `brauo.com/pricing`, a real 200 route) in the popup and options page;
  the compact reader bar stays clean (filter only, no extra chrome).

## Constraints
- Public repo: only `brauo-*` IDs, tiers, neutral copy. No provider names, no margins.
- Conventions: English in code/manifest; no em dash; commits 100% Andres.
- CHANGELOG rule (never edit changelogs unless asked): shipping 0.8.0 is the implicit ask for its notes; flag to Andres.

## Tasks
| # | Scope | Files | Verify |
|---|-------|-------|--------|
| 01 | Plan-based voice filtering + snap + fallback tiers + hints + version/changelog | shared.js, voices.js, background.js, content.js, options.js, options.html, popup.js, popup.html, manifest.json, CHANGELOG.md | `node --check` each JS; manifest 0.8.0; CHANGELOG 0.8.0; diff review |

## Release (orchestrator, outward-facing - needs Andres OK)
Tag `v0.8.0` -> `.github/workflows/release.yml` builds the zip + SHA-256 + provenance + GitHub Release.
