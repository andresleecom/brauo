# MAP: Chrome Web Store prep (E2)

**Goal:** The extension repo contains everything Andres needs to submit to the Chrome Web Store in one sitting: privacy policy with a usable public URL, real store assets (icon 32, promo tile 440x280, base screenshots), en+es manifest localization, CHANGELOG, and a step-by-step submission checklist with ready-to-paste listing copy. Andres only creates the developer account entry and clicks Publish.
**Base:** main @ 1e3894d · **Branch:** map/store-e2 · **Tier:** M
**Non-goals:** actual CWS submission, OAuth/signup (WS-3), Firefox port, brauo-api changes, embedding any key, full UI i18n.

## Decisions
- D01 Entry point stays the `<all_urls>` bubble for the first submission; the action button + activeTab/scripting switch is documented as a post-launch follow-up. A permission reduction after publish is safe, an increase triggers re-review, so shipping as-is keeps both doors open. The switch itself is a product UX change, too large for this MAP's "if small" clause.
- D02 Version bumps to 0.2.1: packaging and metadata only, no behavior change.
- D03 _locales scope is the manifest name/description (en default + es), per the MAP-06 doc; the UI stays English for now.
- D04 PRIVACY.md lives at the repo root. The submission checklist uses its GitHub URL as the public privacy policy URL until brauo.com/privacy exists (CWS accepts any public URL).
- D05 Real generated assets, not placeholders: store/ holds the sources (promo-tile.html, render-assets.mjs) and the rendered PNGs (promo 440x280, two screenshots 1280x800); icons/icon32.png joins manifest icons. No "action" manifest key while D01 stands (a toolbar button with no handler is worse than none).
- D06 The orchestrator runs the renders during verify (CDP pipeline; Chrome 150 on this host requires Extensions.loadUnpacked with a forward-slash path, --load-extension is dead) and commits the PNGs with the task.
- D07 Executor: codex gpt-5.6-sol dispatched with -s danger-full-access from the start (this host's workspace-write sandbox dies with error 5; established in MAP-05).
- D08 Store zip contains exactly: manifest.json, background.js, content.js, content.css, options.html, options.js, shared.js, voices.js, icons/, _locales/. The zip command is documented in SUBMIT.md; store/, docs, and dotfiles stay out.
- D09 Listing copy (en + es) ships ready to paste inside SUBMIT.md, including the single-purpose justification for `<all_urls>` aimed at the CWS reviewer.
- D10 Promo tile design: options-page palette (#1f3b57 navy, #1884c8 accent, white card aesthetic), icon128 artwork, "Brauo" wordmark plus "Read any page aloud" tagline, no provider names anywhere.

## Constraints
- Public repo: no keys, no margins, no voice-to-provider mapping; Deepgram named only in the BYO path.
- Plain MV3, no build step, no dependencies; store/ tooling is plain Node + CDP against installed Chrome, dev-time only.
- English in all code and docs; no em dashes; Markdown sentences one per line.
- Executor: no git, no dependency changes, scope only.

## Verify commands
- Syntax: `node --check` on the 5 extension JS files and store/render-assets.mjs.
- JSON: manifest.json plus every _locales/*/messages.json parse clean.
- Secrets grep: `git grep -nE "brauo_sk_[A-Za-z0-9]{8,}"` finds nothing.
- Assets: rendered PNGs exist with exact dimensions 32x32, 440x280, 1280x800 (read from PNG IHDR).
- Flow: CDP load-unpacked smoke still boots options and content bar with localized manifest.

## Tasks
| # | Task | Scope (files/areas) | Bar | Status |
|---|------|---------------------|-----|--------|
| 01 | PRIVACY.md (CWS-compliant, dual service, neutral cloud copy) + README privacy link | PRIVACY.md, README.md (one link line) | review | done |
| 02 | Asset pipeline: store/promo-tile.html + store/render-assets.mjs producing icon32, promo, 2 screenshots | store/promo-tile.html, store/render-assets.mjs | build+flow | done |
| 03 | _locales en + es and manifest store fields: default_locale, __MSG__ name/description, icons.32, homepage_url, version 0.2.1 | _locales/**, manifest.json | build | done |
| 04 | CHANGELOG.md (0.1.0, 0.2.0, 0.2.1) + README store-oriented install section | CHANGELOG.md, README.md | review | pending |
| 05 | store/SUBMIT.md: full submission checklist, listing copy en/es, permission justification, screenshot guide, zip command, D01 follow-up note | store/SUBMIT.md | review | pending |

Bar legend: build = diff review + node --check/JSON parse · review = diff review + docs read · +flow = orchestrator also runs the renders and validates outputs.

Status values: `pending` · `done` · `blocked` · `takeover`.
