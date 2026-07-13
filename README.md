# Brauo 🔊

**Point at a paragraph, click, and listen.**
Brauo is an open-source Chrome extension that reads any web page aloud with natural voices via Brauo Cloud.

## How it works

1. Click the floating **🔊 bubble** on any page to enter reading mode.
2. Move your mouse: each readable block is highlighted.
3. **Click the paragraph where you want to start.** Brauo reads from there to the end of the document, advancing block by block and prefetching the next audio for smooth playback.
4. Use the floating bar to **pause/resume**, **stop**, switch **voice**, or change **speed** (1×–2×).

The block being read is highlighted and kept in view.
Tables are read row by row.
Long paragraphs are split at sentence boundaries to respect request limits.

## Install

### From the Chrome Web Store

Coming soon. The listing link will appear here once Brauo is published.

### Unpacked (developers)

1. Download this repository and extract it.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `brauo` folder.
3. Get a free Brauo API key at [brauo.com](https://brauo.com). The free tier includes approximately 20 credits per day.
4. Open the extension **Options**, paste the key, choose a voice, and click **Save**.

## Usage

1. Open any web page.
2. Click the floating **🔊 bubble**.
3. Point to a paragraph and click it to start reading.
4. Use the floating controls to pause, resume, stop, change voice, or adjust playback speed.

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
