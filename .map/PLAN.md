# MAP-22 - Extension: connect-without-paste + read selection

Full plan: `brauo-api/docs/map/MAP-22-extension-connect-selection.md` (decisions D01-D09).
Working plan on branch `map/connect-selection`. Primary repo: extension (this repo, PUBLIC/MIT).
One coupled task in brauo-web (the Connect action that pushes the key).

## Goal

Stop asking users to paste an API key ("Sign in with Brauo" -> brauo.com sends the key via `externally_connectable`), and let users read an arbitrary selected region, not only from a clicked block to the end.

## Constraints

- PUBLIC repo: only `brauo-*` ids, tiers, neutral copy. No provider names, no margins, no keys in git.
- Executor: **codex** (`codex exec -m gpt-5.6-sol`); orchestrator reviews/verifies/commits. Fall back per the MAP chain only if codex fails.
- Security: `externally_connectable.matches` = `https://brauo.com/*` only; the handler validates `sender.origin`.
- Version bump to **0.12.0** (0.11.0 is the catalog auto-refresh).

## Tasks

| # | Task | Repo | Status |
|---|---|---|---|
| 01 | manifest `externally_connectable` + background `onMessageExternal` (validate origin, store key + plan) | extension | done (6e755c9) |
| 02 | popup "Sign in with Brauo" (opens brauo.com; refreshes to ready on connect) | extension | done (c327e1a) |
| 03 | brauo-web: "Connect extension" action that sends `{apiKey, plan}` to the extension id | brauo-web | BLOCKED - keys are hashed; the full key is only in memory at registration/rotation. Decide: connect-at-registration vs rotate-on-connect |
| 04 | content.js "Read selection" (window.getSelection -> read exactly that; click-to-read unchanged) | extension | done (c4318f7) |
| 05 | release: manifest 0.12.0 + CHANGELOG + SUBMIT.md + tag | extension | pending (after 03) |

## Log

See `.map/LOG.md`.
