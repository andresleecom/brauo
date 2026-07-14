# Task 01 - Brauo Original badge + language-aware default voice

Brauo Chrome extension (MV3, plain JS, no build step). Two changes plus a version bump. Follow the spec
exactly. Public repo: keep copy neutral (only `brauo-*` ids; "Brauo Original" is a brand label, never a
provider name).

## Context
- `GET /v1/voices` now returns a `badge` field (value `"Brauo Original"`) on self-hosted voices.
- `background.js` `BrauoCloudProvider.listVoices` currently maps each voice to
  `{ model: v.id, name: v.display_name || v.id, lang: v.language || "?", tier: v.tier || "pro" }`.
- `shared.js` `brauoRenderVoiceOptions(sel, voiceList, selected, opts)` builds the `<option>`s; the label
  line is `opt.textContent = opts && opts.withAccent && v.accent ? \`${v.name} - ${v.accent}\` : v.name;`.
- `shared.js` has `const BRAUO_CLOUD_DEFAULT_VOICE = "brauo-luna-es";` used only by `brauoNormalizeConfig`:
  `voice: (sync.cloud && sync.cloud.voice) || BRAUO_CLOUD_DEFAULT_VOICE,`.
- `voices.js` has the bundled fallback `BRAUO_CLOUD_FALLBACK_VOICES` (objects with model/name/lang/tier).

## Edits

### 1. background.js - keep the badge in the mapped voice objects
```js
    return (data.voices || []).map((v) => ({
      model: v.id,
      name: v.display_name || v.id,
      lang: v.language || "?",
      tier: v.tier || "pro",
      badge: v.badge || ""
    }));
```

### 2. shared.js
(a) Replace the single default constant with a language-aware helper. Remove the
`const BRAUO_CLOUD_DEFAULT_VOICE = "brauo-luna-es";` line and add:
```js
// Default voice for a new user: one of Brauo's own (self-hosted, free) voices in
// the user's browser language. es -> Elena, pt -> Bia, otherwise Milo (English).
function brauoDefaultVoice() {
  const lang = ((typeof navigator !== "undefined" && navigator.language) || "en").slice(0, 2).toLowerCase();
  if (lang === "es") return "brauo-elena-es";
  if (lang === "pt") return "brauo-bia-pt";
  return "brauo-milo-en";
}
```
(b) In `brauoNormalizeConfig`, use the helper:
```js
      voice: (sync.cloud && sync.cloud.voice) || brauoDefaultVoice(),
```
(c) In `brauoRenderVoiceOptions`, append the badge to the option label when present:
```js
      const label = opts && opts.withAccent && v.accent ? `${v.name} - ${v.accent}` : v.name;
      opt.textContent = v.badge ? `${label} · ${v.badge}` : label;
```
(Replace the existing single `opt.textContent = ...` assignment with these two lines.)

### 3. voices.js - badge the free voices in the bundled fallback so the badge shows before the live catalog loads
Add `badge: "Brauo Original"` to each `tier: "free"` entry (leave the `tier: "pro"` entries unchanged), e.g.:
```js
  { model: "brauo-elena-es", name: "Elena", lang: "es", tier: "free", badge: "Brauo Original" },
```
Do this for every free entry in `BRAUO_CLOUD_FALLBACK_VOICES`.

### 4. manifest.json - bump `"version"` `"0.9.0"` -> `"0.10.0"`.

### 5. CHANGELOG.md - add at the very top (below `# Changelog`), keeping the existing 0.9.0 entry:
```markdown
## [0.10.0] - 2026-07-14

- Brauo's own voices now show a "Brauo Original" badge in the voice picker.
- New installs default to a Brauo Original voice in your language (Spanish, Portuguese, or English) instead of a paid voice.
```

## Verify (run and paste in PROOF)
- `node --check shared.js && node --check background.js && node --check voices.js`
- `node -e "console.log('version', require('./manifest.json').version)"`
- `grep -n '0.10.0' CHANGELOG.md | head -1`

HARD RULES - violating any means your work is discarded:
- NO git commands. NO dependency changes. NO tool installs.
- Edit ONLY: shared.js, background.js, voices.js, manifest.json, CHANGELOG.md. Anything else -> STOP and explain.
- Keep the public repo neutral: no provider names.
- If blocked or uncertain, STOP and report.
- End with:
  ## REPORT
  STATUS: done | blocked
  FILES TOUCHED: <list>
  PROOF: <verification output>
  NOTES: <=10 lines>
