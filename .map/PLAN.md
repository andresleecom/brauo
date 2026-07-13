# MAP-17 - Extension brand pass (comilla mark, night palette)

Tier: M. Repo: brauo. Branch: map/brand-icons from main.
Source of truth: "Brauo Brand Guidelines" (v1.0). Rule: the mark is the player
(the guillemet » chevrons), never a speaker. Palette: night ink, paper, celeste.

## Goal

Replace the speaker icon and the legacy navy/blue UI with the comilla brand mark
and the night/paper/celeste system everywhere in the extension: app/toolbar/store
icons, the floating bubble and bar, the options page, and the store promo tile.
Bump to 0.5.0. Keep system fonts in shipped surfaces (no external font requests,
so the "only api.brauo.com" story holds).

## Non-goals

- No behavior change (reading, activeTab, provider, options logic all unchanged).
- No external fonts in the extension itself (the promo tile is a build-time image,
  so it may load the brand font).
- No web change (brauo.com already uses the comilla system).

## Brand tokens (extension)

night `#0a0d16` · ink-well `#070a12` · panel `#0d1120` · paper `#eef2f8` ·
celeste `#9ccbe8` · slate `#93a0b4` · muted `#75819a` (AA-safe) ·
hairline `rgba(238,242,248,0.12)` · success `#7fd0a2` · danger `#e08c8c`.
Corners 8px (inputs/buttons); the bubble stays a circle, the control bar a pill.
The mark: two `»` chevrons, celeste `#9ccbe8` then paper `#eef2f8`, on `#0d1120`.
Canonical icon source: `icons/icon.svg` (already added).

## Tasks

| NN | Executor | Scope (files) | Change | Verify bar | Proof |
|----|----------|---------------|--------|------------|-------|
| 01 | codex | `content.js`, `content.css` | Bubble `🔊` -> inline comilla SVG mark; restyle bar/bubble/controls/hover/current to the brand palette (no speaker, no navy/blue/yellow). | `node --check content.js`; no `🔊`, `#1f3b57`, `#1884c8`, or yellow highlight left in the two files. | grep + diffs |
| 02 | codex | `options.html`, `store/promo-tile.html`, `manifest.json`, `CHANGELOG.md` | Options page -> dark night theme (keep every element id; only restyle + optional mark in header). Promo tile -> night palette + brand font (Schibsted Grotesk via Google Fonts, build-time only). manifest version 0.5.0; CHANGELOG 0.5.0 entry. | manifest 0.5.0; options.html keeps ids `cloudKey/cloudVoice/cloudBaseUrl/speed/save/status`; no `#1f3b57`/`#1884c8` left in options.html/promo-tile.html; both HTML parse. | grep + diffs |
| 03 | orchestrator | `icons/icon{16,32,48,128}.png`, `store/promo-440x280.png`, `store/screenshot-options-1280x800.png`, `store/screenshot-reading-1280x800.png` | Rasterize `icon.svg` to the 4 PNGs; regenerate the promo tile, the options screenshot, and the reading screenshot (branded bar) headlessly. | icons are the comilla (visual check); screenshots show the brand palette. | screenshots |

## Verify bar (plan level)

- All JS parses; manifests/HTML valid.
- Visual check: icons are the comilla mark; the floating bar and options page are
  night/paper/celeste; the promo tile is on brand.
- Rebuild `brauo-0.5.0.zip`; after merge, tag `v0.5.0` (with Andres's go) for the
  attested release. Andres re-uploads the new zip + store icon + screenshots to CWS.
