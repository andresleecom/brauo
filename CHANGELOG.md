# Changelog

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
