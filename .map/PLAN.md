# MAP-16 - Release via CI with provenance + download trust docs

Tier: M. Repo: brauo (public extension). Branch: map/release-trust from main.
Goal set by Andres: publish the build zip for direct download, document install,
and give users confidence the zip has no injected/tampered code.

## Goal

Ship each release from GitHub Actions (not by hand) as a GitHub Release asset,
with a SHA-256 checksum and a signed SLSA build-provenance attestation. Document
install (Chrome Web Store first, manual-from-release second) and how to verify a
download. Add trust badges.

## Non-goals

- No extension code change.
- No committing any zip to git (it stays a Release asset; `.gitignore` already
  ignores `*.zip`).
- No byte-for-byte reproducible zip (provenance + checksum are the trust anchor).
- No CWS publish automation.

## Decision register

- D01 Release workflow: `.github/workflows/release.yml` triggers on tag `v*`. It
  checks the manifest version equals the tag, builds the zip, writes a SHA-256
  file, attests provenance with the official `actions/attest-build-provenance@v1`,
  and publishes the Release with the `gh` CLI (no third-party action). Permissions:
  `contents: write`, `id-token: write`, `attestations: write`.
- D02 Trust surface in README: badges (MIT license, latest release, verified
  build), an Install section (Chrome Web Store recommended, manual-from-release
  second), and a "Verify your download" section (checksum + `gh attestation
  verify` + the unminified/MIT transparency note).
- D03 `SECURITY.md`: mirrors the verify steps and points vulnerability reports to
  GitHub private security advisories.

## Tasks

| NN | Executor | Scope (files) | Change | Verify bar | Proof |
|----|----------|---------------|--------|------------|-------|
| 01 | orchestrator | `.github/workflows/release.yml` | Author the release+provenance workflow (D01). | YAML parses; `on.push.tags`=`v*`; permissions include id-token+attestations; steps include attest-build-provenance and `gh release create`. | file content review |
| 02 | codex | `README.md`, `SECURITY.md` | Badges + Install rework + Verify-your-download (D02) + SECURITY.md (D03). | README has the three badges, a Verify-your-download section, and Install no longer says "download this repository"; SECURITY.md exists with verify + reporting. | grep + diffs |

## Verify bar (plan level)

- Workflow YAML is well formed (the true test is a tag push, which builds and
  attests the release).
- README/SECURITY render, contain the verify instructions, and no stale
  "download this repository" wording.
- After merge, tagging `v0.4.0` (with Andres's go) triggers the first attested
  release.
