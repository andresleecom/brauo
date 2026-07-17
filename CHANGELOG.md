# Changelog

## [0.15.0] - 2026-07-17

- Slow voices now start speaking within a few seconds: long paragraphs are requested sentence by sentence and playback begins as soon as the first one is ready, instead of waiting for the whole paragraph.
- The reader detects slow voices automatically (and re-checks daily), so fast voices keep their existing behavior.

## [0.14.0] - 2026-07-16

- Fix Sign in with Brauo so the account page delivers the key back to this exact extension.

## [0.13.0] - 2026-07-16

- Sign in with Brauo now connects the extension automatically after you log in on brauo.com, with no key to paste.

## [0.12.0] - 2026-07-16

- Sign in with Brauo: connect the extension from brauo.com without pasting an API key (pasting still works as a fallback).
- Read selection: select text on a page and read just that part, instead of always reading from a paragraph to the end.

## [0.11.0] - 2026-07-16

- The voice list now refreshes on its own, so newly added voices and languages appear without pressing "Load voices" in Options.

## [0.10.0] - 2026-07-14

- Brauo's own voices now show a "Brauo Original" badge in the voice picker.
- New installs default to a Brauo Original voice in your language (Spanish, Portuguese, or English) instead of a paid voice.

## [0.9.0] - 2026-07-14

- Switching voice no longer re-reads (and re-charges) the current paragraph: the new voice applies from the next block while reading.
- When not reading, changing voice plays a short sample so you can compare voices without spending credits on the page.

## [0.8.0] - 2026-07-14

- Free accounts now see only the voices included in the free plan, and the reader switches to a free voice automatically.
- Added an upgrade link so free users can find the full voice catalog.

## [0.7.0] - 2026-07-13

- Reading now recovers from network hiccups: a failed block retries with backoff, and if it still fails the reader pauses and you can resume with the play button instead of stopping silently.
- Clear status while generating audio, on reconnecting, and when offline.
- Switching voice mid-read now restarts the current paragraph cleanly in the new voice (no overlapping audio).

## [0.6.0] - 2026-07-13

- Clicking the Brauo icon now opens a popup showing your plan and remaining credits, with a button to read the current page.
- Set up from the popup: create a free account and paste your API key.

## [0.5.0] - 2026-07-13

- New brand icon: the guillemet (`»`) player mark replaces the speaker icon.
- The floating reader, options page, and promo art move to the night, paper, and celeste palette.

## [0.4.0] - 2026-07-13

- The reader now activates from the Brauo toolbar button instead of injecting on every page.
- Replaced the broad host access with the `activeTab` and `scripting` permissions, so the extension no longer needs access to all sites.

## [0.3.0] - 2026-07-13

- The extension is now Brauo Cloud only.
- Removed the separate bring-your-own-provider mode.
- Simplified setup to one Brauo API key and one host permission for `api.brauo.com`.

## [0.2.1] - 2026-07-11

- Added localized names and descriptions in English and Spanish.
- Added a 32-pixel icon and homepage URL.
- Added the privacy policy, store assets, and submission documentation.
- This release has no behavior changes.

## [0.2.0] - 2026-07-11

- Added Brauo Cloud alongside the original bring-your-own-provider mode, with a cloud key stored on-device.
- Added voice selection for each mode and a neutral cloud interface.
- Added an audio cache keyed by text and voice.
- Added retry handling with backoff.
- Added host permission for api.brauo.com.

## [0.1.0] - 2026-07

- Initial release.
- Added point-and-click read aloud with natural voices.
- Supported bringing your own provider key.
