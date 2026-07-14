# Task 01 - Free-tier voice filtering in the extension

You are editing the Brauo Chrome extension (MV3, plain JS, no build step). Implement client-side
voice filtering so FREE-plan users only see/use free voices, while paid/unknown plans keep all voices.
The gateway already enforces this with a 403; this is the UX half. Follow the spec EXACTLY - the
design is frozen. Do not add features beyond what is listed.

Context you must know:
- Voices carry a `tier` field: `"free"` (Kokoro) or `"pro"` (paid). `GET /v1/voices` returns it.
- The popup is the entry point: clicking the toolbar icon opens the popup, which fetches
  `GET /v1/account` (plan + credits); its "Read this page" button injects the reader (`content.js`).
- Rendering helper `brauoRenderVoiceOptions(sel, voiceList, selected, opts)` lives in `shared.js`.
- Voice objects in the extension use `{ model, name, lang, tier }` (note `model`, not `id`).

## Edits

### 1. shared.js - add two helpers (place right after `brauoRenderVoiceOptions`)
```js
function brauoVoicesForPlan(voices, plan) {
  if (String(plan || "").toLowerCase() === "free") {
    return voices.filter((v) => v.tier === "free");
  }
  return voices;
}

function brauoResolveVoiceForPlan(voices, plan, selected) {
  if (String(plan || "").toLowerCase() !== "free") return selected;
  const allowed = brauoVoicesForPlan(voices, plan);
  if (allowed.some((v) => v.model === selected)) return selected;
  return allowed.length ? allowed[0].model : selected;
}
```

### 2. voices.js - replace the whole `BRAUO_CLOUD_FALLBACK_VOICES` array with a tiered list that includes free voices:
```js
const BRAUO_CLOUD_FALLBACK_VOICES = [
  { model: "brauo-elena-es", name: "Elena", lang: "es", tier: "free" },
  { model: "brauo-diego-es", name: "Diego", lang: "es", tier: "free" },
  { model: "brauo-iris-en", name: "Iris", lang: "en-US", tier: "free" },
  { model: "brauo-milo-en", name: "Milo", lang: "en-US", tier: "free" },
  { model: "brauo-luna-es", name: "Luna", lang: "es-CO", tier: "pro" },
  { model: "brauo-nova-en", name: "Nova", lang: "en-US", tier: "pro" }
];
```

### 3. background.js - in `BrauoCloudProvider.listVoices`, keep `tier` in the mapped objects. Change the map to:
```js
    return (data.voices || []).map((v) => ({
      model: v.id,
      name: v.display_name || v.id,
      lang: v.language || "?",
      tier: v.tier || "pro"
    }));
```
(Default to `"pro"` when tier is missing, so an untiered voice is never shown to a free user.)

### 4. content.js - the reader.
- Add a module var `let cloudPlan = null;` next to `let cloudCatalog = null;`.
- In the `lastLocal` initializer object, add `cloudPlan: null`.
- In the settings-load `chrome.storage.local.get({...})` defaults, add `cloudPlan: null`; in its `.then`,
  add `cloudPlan = local.cloudPlan;` next to `cloudCatalog = local.cloudCatalog;`.
- Replace `renderVoices()` with:
```js
  function renderVoices() {
    const all = cloudCatalog && cloudCatalog.length ? cloudCatalog : BRAUO_CLOUD_FALLBACK_VOICES;
    const resolved = brauoResolveVoiceForPlan(all, cloudPlan, activeVoice());
    if (resolved !== cfg.cloud.voice) {
      cfg = { ...cfg, cloud: { ...cfg.cloud, voice: resolved } };
      chrome.storage.sync.set({ cloud: { voice: resolved } });
    }
    brauoRenderVoiceOptions(voiceSel, brauoVoicesForPlan(all, cloudPlan), resolved);
  }
```
- In the `chrome.storage.onChanged` listener, inside the `if (area === "local")` block add
  `cloudPlan = lastLocal.cloudPlan || null;`, and extend the re-render condition so a `cloudPlan`
  change also re-renders:
```js
    const cloudCatalogChanged = area === "local" && changes.cloudCatalog;
    const cloudPlanChanged = area === "local" && changes.cloudPlan;
    if (previousVoice !== activeVoice() || cloudCatalogChanged || cloudPlanChanged) renderVoices();
```

### 5. options.js - the options page.
- Add a module var `let cloudPlan = null;` next to `let cloudCatalog = null;`.
- In the initial load `chrome.storage.local.get({...})` defaults add `cloudPlan: null`; in its `.then`,
  set `cloudPlan = local.cloudPlan;`.
- Replace `renderCloudVoices(selected)` with:
```js
function renderCloudVoices(selected) {
  const all = cloudVoices();
  const shown = brauoVoicesForPlan(all, cloudPlan);
  const resolved = brauoResolveVoiceForPlan(all, cloudPlan, selected);
  brauoRenderVoiceOptions($("cloudVoice"), shown, resolved);
  $("cloudVoiceCount").textContent = `${shown.length} voices available` +
    (cloudCatalog && cloudCatalog.length ? " (live catalog)" : " (bundled list)");
  $("cloudUpgrade").style.display = String(cloudPlan || "").toLowerCase() === "free" ? "block" : "none";
}
```

### 6. options.html - add the upgrade link right after the `<p class="hint" id="cloudVoiceCount"></p>` line:
```html
      <a class="hint" id="cloudUpgrade" href="https://brauo.com/pricing" target="_blank" style="display:none;color:#9ccbe8">Upgrade for more voices &rarr;</a>
```

### 7. popup.js - cache the plan, toggle the upgrade link, fix the account URL.
- After `const normalizedPlan = String(plan || "").toLowerCase();`, add:
```js
    await chrome.storage.local.set({ cloudPlan: normalizedPlan });
    document.getElementById("upgrade").style.display = normalizedPlan === "free" ? "block" : "none";
```
- In `showSetup(...)`, hide the upgrade link: add
  `document.getElementById("upgrade").style.display = "none";` (with the other resets).
- Change the account link URL from `https://brauo.com/cuenta` to `https://brauo.com/account`.

### 8. popup.html - add the upgrade link inside `<section id="ready">`, right after the `.links` `</div>`:
```html
      <a id="upgrade" class="hint" href="https://brauo.com/pricing" target="_blank" style="display:none;color:#9ccbe8;text-decoration:none">Unlock all voices &rarr;</a>
```

### 9. manifest.json - bump `"version"` from `"0.7.0"` to `"0.8.0"`.

### 10. CHANGELOG.md - add a new entry at the very top (below the `# Changelog` heading):
```markdown
## [0.8.0] - 2026-07-14

- Free accounts now see only the voices included in the free plan, and the reader switches to a free voice automatically.
- Added an upgrade link so free users can find the full voice catalog.
```

## Verify (run these and paste output in PROOF)
- `node --check shared.js && node --check voices.js && node --check background.js && node --check content.js && node --check options.js && node --check popup.js`
- `node -e "const s=require('fs').readFileSync('manifest.json','utf8');console.log('version', JSON.parse(s).version)"`
- `grep -n '0.8.0' CHANGELOG.md | head -1`

HARD RULES - violating any of these means your work is discarded:
- NO git commands of any kind (no commit, branch, push, reset, checkout, stash).
- NO dependency changes: no package installs, no lockfile edits, no tool installs.
- Edit ONLY the files listed above. If the fix requires touching anything else, STOP and explain in your REPORT instead of doing it.
- If blocked or uncertain, STOP and report - do not improvise around the spec.
- End your output with:
  ## REPORT
  STATUS: done | blocked
  FILES TOUCHED: <list>
  PROOF: <output of the verification commands you were asked to run>
  NOTES: <=10 lines: decisions made, anything the reviewer must know>
