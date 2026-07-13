# Brauo 🔊

**Point at a paragraph, click, and listen.**
Brauo is an open-source Chrome extension that reads any web page aloud with natural voices via Brauo Cloud.

[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/andresleecom/brauo?sort=semver)](https://github.com/andresleecom/brauo/releases/latest)
[![Verified build](https://img.shields.io/badge/build-provenance%20attested-brightgreen)](#verify-your-download)

## How it works

1. Click the **Brauo icon in the browser toolbar** to start reading mode on the current page.
2. Move your mouse: each readable block is highlighted.
3. **Click the paragraph where you want to start.** Brauo reads from there to the end of the document, advancing block by block and prefetching the next audio for smooth playback.
4. Use the floating bar to **pause/resume**, **stop**, switch **voice**, or change **speed** (1×–2×).

The block being read is highlighted and kept in view.
Tables are read row by row.
Long paragraphs are split at sentence boundaries to respect request limits.

## Install

### From the Chrome Web Store (recommended)

Coming soon. The listing link will appear here once Brauo is published. The Chrome Web Store is the recommended way to install: it updates automatically, and Google reviews every release.

### Manual install from a release

1. Download `brauo-<version>.zip` from the [latest release](https://github.com/andresleecom/brauo/releases/latest).
2. Optional but recommended: [verify the download](#verify-your-download).
3. Unzip it, then open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the unzipped folder.
4. Get a free Brauo API key at [brauo.com](https://brauo.com). The free tier includes approximately 20 credits per day.
5. Open the extension **Options**, paste the key, choose a voice, and click **Save**.

## Verify your download

Brauo is plain, unminified JavaScript under the MIT license. Every file in the release zip is identical to the source in this repository at the matching tag, so you can read exactly what you run.

Each release is built by GitHub Actions - not by hand - and ships with a SHA-256 checksum and a signed build-provenance attestation.

Check the download's integrity:

```
sha256sum -c brauo-<version>.zip.sha256
```

Verify GitHub Actions built the zip from this repository's tagged commit:

```
gh attestation verify brauo-<version>.zip --repo andresleecom/brauo
```

## Usage

1. Open any web page.
2. Click the **Brauo icon in the browser toolbar** to start reading mode on the current page.
3. Point to a paragraph and click it to start reading.
4. Use the floating controls to pause, resume, stop, change voice, or adjust playback speed.

Brauo activates only on the tab where you click its toolbar icon.
Brauo sends reading requests only to the Brauo API at `https://api.brauo.com`.

## Configuration

Everything is configured on the Options page:

| Setting | Description |
|---|---|
| Brauo API key | Your key is stored on this device in `chrome.storage.local`. |
| Default voice | The voice used when reading begins. |
| Speed | Default playback rate (1×–2×). |

The remaining settings are stored in `chrome.storage.sync`.
You can also switch voices directly from the floating bar while reading.

## Privacy

- The text you choose to read is sent to Brauo Cloud at `api.brauo.com` to generate audio.
- Your API key is stored locally and sent only to `api.brauo.com` to authenticate requests.
- Brauo has no analytics and no tracking.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Notes

- See [CHANGELOG.md](CHANGELOG.md) for version history.
- Audio requests are made from the extension service worker, so pages with strict CSP work fine.
- Built with plain Manifest V3, with no build step and no dependencies.

## Roadmap

- [ ] Read selected text only
- [ ] Keyboard shortcuts (play/pause, next/previous block)
- [ ] Skip navigation/boilerplate heuristics
- [ ] Sentence-level highlighting
- [ ] Firefox port

## Smoke test

Load the extension unpacked.
Open Options, paste a Brauo API key, choose a voice, and click Save.
Open a long article and read it end to end.
Confirm the service worker network log shows only `api.brauo.com` requests.
Confirm the floating controls can pause, resume, stop, change voice, and adjust playback speed.

## License

[MIT](LICENSE) © Andres Lee
