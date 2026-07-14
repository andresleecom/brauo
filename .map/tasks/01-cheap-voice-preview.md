# Task 01 - Cheap voice preview; stop re-charging on voice switch

Brauo Chrome extension (MV3, plain JS, no build step). Make switching the reader's voice cheap. Follow
the spec exactly; do not change server calls or the metering model.

## Context (read these first)
- `content.js` is the reader. Relevant existing pieces:
  - `cfg.cloud.voice` is the active voice; `activeVoice()` returns it; the reading loop `playFrom(i)` calls
    `getBlockAudio(i)` which caches per (voice,text) and PREFETCHES `idx+1` while playing `idx`.
  - `cache` is a `Map` of client-side audio promises keyed by `cacheKey(text, voice)`.
  - `stopAll()` stops the reading session (`audio`, `resolveCurrent`, `playing`).
  - The current voice-change handler re-reads the current block (the bug):
    ```js
    voiceSel.addEventListener("change", () => {
      const voice = voiceSel.value;
      cfg = { ...cfg, cloud: { ...cfg.cloud, voice } };
      chrome.storage.sync.set({ cloud: { voice } });
      if (playing) {
        cache.clear();
        setStatus("Switching voice…", true);
        playFrom(idx >= 0 ? idx : 0);   // <-- re-synthesizes + re-charges the current block
      } else {
        setStatus("Voice: " + voiceSel.selectedOptions[0].textContent);
      }
    });
    ```
  - `setStatus(text, loading)` sets the bar status (+ spinner). Audio is played by building
    `new Audio("data:" + mime + ";base64," + b64)`. TTS is requested via
    `chrome.runtime.sendMessage({ type: "tts", text, voice }, cb)` (cb gets `{ ok, b64, mime, code, error }`).

## Edits

### 1. shared.js - add the preview sample constant (near the other `BRAUO_*` constants)
```js
const BRAUO_PREVIEW_SAMPLE = "This is how I sound.";
```

### 2. content.js
(a) Add a module-scoped `let previewAudio = null;` near the other reader state vars (next to `let audio = null;`).

(b) Add a `previewVoice(voice)` function (place it near `renderVoices`/the TTS helpers). It plays the
short sample in `voice` using its OWN audio element, independent of the reading session:
```js
  function previewVoice(voice) {
    if (previewAudio) { try { previewAudio.pause(); } catch (_) {} previewAudio = null; }
    setStatus("Preview…", true);
    chrome.runtime.sendMessage({ type: "tts", text: BRAUO_PREVIEW_SAMPLE, voice }, (resp) => {
      if (chrome.runtime.lastError || !resp || !resp.ok) {
        setStatus("Preview failed: " + ((resp && resp.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || "no response"));
        return;
      }
      previewAudio = new Audio("data:" + (resp.mime || "audio/mp3") + ";base64," + resp.b64);
      previewAudio.playbackRate = parseFloat(speedSel.value);
      previewAudio.play().catch(() => {});
      const opt = voiceSel.selectedOptions[0];
      setStatus("Voice: " + (opt ? opt.textContent : voice));
    });
  }
```

(c) In `stopAll()`, also stop a playing preview so starting a read never overlaps it. Add, alongside the
existing `audio` teardown:
```js
    if (previewAudio) { try { previewAudio.pause(); } catch (_) {} previewAudio = null; }
```

(d) Replace the `voiceSel` change handler body with the cheap behavior:
```js
  voiceSel.addEventListener("change", () => {
    const voice = voiceSel.value;
    cfg = { ...cfg, cloud: { ...cfg.cloud, voice } };
    chrome.storage.sync.set({ cloud: { voice } });
    if (playing) {
      // Apply the new voice to upcoming blocks WITHOUT re-reading (and re-charging) the
      // current one: drop the stale-voice prefetch so the next block is synthesized in the
      // new voice; the current block finishes in the previous voice.
      cache.clear();
      setStatus(`Reading ${idx + 1} / ${blocks.length} · new voice from the next block`);
    } else {
      // Idle: a short, cheap sample so voices can be compared on identical text.
      previewVoice(voice);
    }
  });
```
Note: `cache.clear()` does not stop the currently playing block (its audio is already resolved); it only
drops prefetched/upcoming entries so the next block uses the new voice.

### 3. manifest.json - bump `"version"` `"0.8.0"` -> `"0.9.0"`.

### 4. CHANGELOG.md - add at the very top (below `# Changelog`):
```markdown
## [0.9.0] - 2026-07-14

- Switching voice no longer re-reads (and re-charges) the current paragraph: the new voice applies from the next block while reading.
- When not reading, changing voice plays a short sample so you can compare voices without spending credits on the page.
```

## Verify (run and paste in PROOF)
- `node --check shared.js && node --check content.js`
- `node -e "console.log('version', require('./manifest.json').version)"`
- `grep -n '0.9.0' CHANGELOG.md | head -1`

HARD RULES - violating any means your work is discarded:
- NO git commands. NO dependency changes. NO tool installs.
- Edit ONLY: shared.js, content.js, manifest.json, CHANGELOG.md. Anything else → STOP and explain in REPORT.
- Keep the public repo neutral: no provider names, only `brauo-*` ids/tiers.
- If blocked or uncertain, STOP and report.
- End with:
  ## REPORT
  STATUS: done | blocked
  FILES TOUCHED: <list>
  PROOF: <verification output>
  NOTES: <=10 lines>
