# MAP-15 - Extension: activeTab entry (drop broad host permission)

Tier: M. Repo: brauo (public extension). Branch: map/extension-activetab from main.
Origin: Chrome Web Store flagged the `<all_urls>` content script as a broad host
permission (in-depth review + scary install warning). Andres chose to migrate to
activeTab.

## Goal

Remove the auto-injected `<all_urls>` content script. Add a toolbar action; on
click, inject the reader into the active tab via `activeTab` + `scripting`. This
removes the "read and change data on all sites" install warning and speeds up
review. The reading experience after activation is unchanged.

## Non-goals

- No change to the reading logic (blocks, prefetch, highlight, playback, chunking).
- No change to the Cloud-only provider, options page, or the API contract.
- Keep the existing store screenshots (the reading bar looks the same after the
  toolbar click; only the entry point changed, which the screenshots do not show).

## Decision register

- D01 Entry point: a toolbar `action` (no popup). `chrome.action.onClicked` injects
  `content.css` + `shared.js` + `voices.js` + `content.js` into the active tab and
  sends a `brauo-activate` message. The reader appears in reading mode.
- D02 Idempotent + toggle: the handler first tries `tabs.sendMessage(brauo-activate)`;
  if that rejects (not injected yet) it injects, then sends the message. content.js
  toggles reading mode on `brauo-activate` (enter if off, exit if on). This avoids
  re-running the `const` declarations in shared.js on a second click.
- D03 Permissions: `["storage", "activeTab", "scripting"]`. host_permissions stays
  `["https://api.brauo.com/*"]` (specific host for the service-worker fetch, not
  broad). No more `content_scripts`.
- D04 Version 0.3.0 -> 0.4.0 (notable entry-point/permission change; also must be
  higher than the 0.3.0 draft already uploaded to CWS).
- D05 Docs/store: README usage and store copy switch "floating speaker bubble" to
  "Brauo toolbar icon". SUBMIT.md drops the content-script-on-all-sites
  justification and adds an activeTab + scripting justification; version -> 0.4.0.
  render-assets.mjs injects the content script via the extension service worker so
  the reading screenshot can still be regenerated.

## Tasks

| NN | Scope (files) | Change | Verify bar | Proof |
|----|---------------|--------|------------|-------|
| 01 | `manifest.json`, `background.js`, `content.js` | activeTab refactor per D01-D04. | `node --check` all JS; manifest valid JSON with permissions `["storage","activeTab","scripting"]`, an `action`, no `content_scripts`, host only api.brauo.com, version 0.4.0. | node/JSON output + diffs |
| 02 | `README.md`, `CHANGELOG.md`, `store/SUBMIT.md`, `store/render-assets.mjs` | Docs/store copy + justifications per D05; render-assets injects the CS via the SW; zip name -> 0.4.0. | locale/JSON still valid; no `<all_urls>`/"floating speaker bubble" left in README/SUBMIT; grep clean of deepgram. | grep + diffs |

## Verify bar (plan level)

- All JS parses; manifest valid with the new permissions/action and version 0.4.0.
- Orchestrator rebuilds `brauo-0.4.0.zip` and (best effort) regenerates the reading
  screenshot via the fixed render-assets.
- Manual live smoke (Andres): load unpacked, click the Brauo toolbar icon on a page,
  confirm the reader appears and reads via api.brauo.com; confirm no "all sites"
  install warning.
