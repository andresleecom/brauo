# Task 02: Store asset pipeline (promo tile + renderer)

## Goal
Two new dev-time files under store/ that generate every image the Chrome Web Store needs, using only Node built-ins and the installed Chrome:
store/promo-tile.html (the 440x280 promo art) and store/render-assets.mjs (renders all PNGs over CDP).
You write the tooling; the orchestrator runs it, so your verify bar is syntax only.

## Context - read these first
- .map/ref/cdp-pattern.mjs - a WORKING CDP script from this machine: WebSocket to /json/version, Target.attachToTarget flatten, Runtime.evaluate, Page.captureScreenshot, Extensions.loadUnpacked. Reuse its connection/eval helpers.
- Machine facts (already proven, do not fight them): Chrome 150 at "C:/Program Files/Google/Chrome/Application/chrome.exe" IGNORES --load-extension; extensions load ONLY via the CDP command Extensions.loadUnpacked with a FORWARD-SLASH absolute path; Chrome must be launched with --headless=new --enable-unsafe-extension-debugging --remote-debugging-port plus a temp --user-data-dir.
- options.html - the visual identity: navy #1f3b57, accent #1884c8, background #f2f4f7, Arial/Helvetica.
- icons/icon128.png - the logo artwork.

## Scope - you may edit
- store/promo-tile.html (new), store/render-assets.mjs (new)

## Out of scope - do not touch
- Everything else. Do NOT run the renderer yourself; do not write any PNG.

## Steps
1. store/promo-tile.html: exactly 440x280 (html,body margin 0, fixed size), subtle vertical gradient #1f3b57 to #16283c, centered column: icons/icon128.png via relative src at about 96px with a soft shadow, "Brauo" wordmark in white (system-ui or Arial, bold, about 44px), tagline "Read any page aloud" in #cfd9e2 (about 17px), one thin #1884c8 accent rule between wordmark and tagline. No other text, no provider names, no em dashes.
2. store/render-assets.mjs (plain Node 20+, no npm deps; child_process, fs, path, os, native fetch and WebSocket):
   - Spawn Chrome itself (env CHROME_PATH overrides the default path above) with the flags from Machine facts, fresh temp profile under os.tmpdir(), port 9377; poll /json/version until ready; always kill the child and remove the profile in a finally block.
   - Output 1: icons/icon32.png. Read icons/icon128.png with fs, embed as a data URL in a Runtime.evaluate on about:blank that draws it onto a 32x32 canvas (imageSmoothingQuality high) and returns canvas.toDataURL("image/png"); decode and write.
   - Output 2: store/promo-440x280.png. Open file://<repo>/store/promo-tile.html, Emulation.setDeviceMetricsOverride 440x280 deviceScaleFactor 1, captureScreenshot.
   - Output 3: store/screenshot-options-1280x800.png. Extensions.loadUnpacked(repo root, forward slashes) -> extId; open chrome-extension://<extId>/options.html at 1280x800, click the Brauo Cloud radio so the cloud section shows, wait for render, captureScreenshot.
   - Output 4: store/screenshot-reading-1280x800.png. Open https://en.wikipedia.org/wiki/Speech_synthesis at 1280x800, wait for #brauo-bar, click #brauo-bubble, then via evaluate stage the real reading UI exactly as the product renders it: add class brauo-current to the first long content paragraph, scroll it into view, set #brauo-status text to "Reading 3 / 42"; captureScreenshot.
   - After writing each PNG, read its IHDR (width = bytes 16-19 BE, height = 20-23) and verify the exact expected dimensions; print a PASS/FAIL line per asset and exit nonzero on any FAIL.
3. Keep the script under ~220 lines, plain style matching the reference, minimal comments. English, no em dashes.

## Verify before reporting
Run: `node --check store/render-assets.mjs`
Paste the output in your REPORT under PROOF. Do not execute the renderer.

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
