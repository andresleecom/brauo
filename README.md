# Brauo 🔊

**Point at a paragraph, click, and listen.**
Brauo is a Chrome extension that reads any web page aloud with natural [Deepgram Aura](https://deepgram.com/product/text-to-speech) voices — 100+ voices across 7+ languages (Spanish, English, German, French, Italian, Japanese, Dutch).

## How it works

1. Click the floating **🔊 bubble** on any page to enter reading mode.
2. Move your mouse: each readable block gets highlighted.
3. **Click the paragraph where you want to start.** Brauo reads from there to the end of the document, auto-advancing block by block and pre-fetching the next audio so there are no gaps.
4. Use the floating bar to **pause/resume**, **stop**, switch **voice** on the fly, or change **speed** (1×–2×).

The block being read is highlighted and kept in view. Tables are read row by row. Long paragraphs are split at sentence boundaries to respect the Deepgram request limit.

## Install (unpacked)

1. Clone this repo:
   ```
   git clone https://github.com/andresleecom/brauo.git
   ```
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `brauo` folder.
3. Open the extension **Options** and paste your Deepgram API key (get one free at [console.deepgram.com](https://console.deepgram.com)).
4. Optional: click **“Load all voices from Deepgram”** to pull the full live voice catalog, and pick your default voice.
5. To read local files (`file://` pages), enable **“Allow access to file URLs”** in the extension details.

## Configuration

Everything lives in the Options page and is stored in `chrome.storage`:

| Setting | Description |
|---|---|
| API key | Your Deepgram key. Stored locally in your browser, never bundled in the code. |
| Default voice | Any Aura voice, grouped by language. Preview before choosing. |
| Speed | Default playback rate (1×–2×). |

You can also switch voices directly from the floating bar while reading.

## Privacy

- Your API key is stored locally via `chrome.storage` and is only sent to `api.deepgram.com`.
- The only data that leaves your browser is the text of the blocks you choose to read, sent to Deepgram to synthesize audio.
- No analytics, no tracking, no third-party servers.

## Notes

- Deepgram bills text-to-speech by characters synthesized; reading long documents consumes credits accordingly.
- Audio requests are made from the extension service worker, so pages with strict CSP work fine.
- Built with plain Manifest V3 — no build step, no dependencies.

## Roadmap

- [ ] Read selected text only
- [ ] Keyboard shortcuts (play/pause, next/previous block)
- [ ] Skip navigation/boilerplate heuristics
- [ ] Sentence-level highlighting
- [ ] Firefox port

## License

[MIT](LICENSE) © Andres Lee
