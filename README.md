# Brauo 🔊

**Point at a paragraph, click, and listen.**
Brauo is a Chrome extension that reads any web page aloud with natural voices.
Voices come from Brauo Cloud by pasting one key in Options, or from your own [Deepgram](https://deepgram.com/product/text-to-speech) account.

## How it works

1. Click the floating **🔊 bubble** on any page to enter reading mode.
2. Move your mouse: each readable block gets highlighted.
3. **Click the paragraph where you want to start.** Brauo reads from there to the end of the document, auto-advancing block by block and pre-fetching the next audio so there are no gaps.
4. Use the floating bar to **pause/resume**, **stop**, switch **voice** on the fly, or change **speed** (1×–2×).

The block being read is highlighted and kept in view.
Tables are read row by row.
Long paragraphs are split at sentence boundaries to respect service request limits.

## Install (unpacked)

1. Clone this repo:
   ```
   git clone https://github.com/andresleecom/brauo.git
   ```
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `brauo` folder.
3. Open the extension **Options**, choose a voice service, enter the key for that service, and click **Save**.
4. Pick your default voice for the selected service.
5. To read local files (`file://` pages), enable **“Allow access to file URLs”** in the extension details.

## Choose a voice service

### Brauo Cloud

Pick **Brauo Cloud** in Options, paste your `brauo_sk_...` key, and click **Save**.
The key is stored only on this device in `chrome.storage.local`.
Brauo Cloud is in early access, so keys are issued manually for now.
Repeated text is served from the service cache, so re-reading is fast.

### Bring your own Deepgram key

Pick **Deepgram** in Options and paste your API key.
You can get a free key at [console.deepgram.com](https://console.deepgram.com).
The key is stored in your browser.
Deepgram bills text-to-speech by characters synthesized, so reading long documents consumes credits accordingly.
Click **Save** after making your choice.

## Configuration

Everything lives in the Options page and is stored in `chrome.storage`; the Brauo Cloud key stays in `chrome.storage.local` on this device:

| Setting | Description |
|---|---|
| Voice service | Choose Brauo Cloud or bring your own Deepgram key. |
| Brauo Cloud API key | Your `brauo_sk_...` key is stored on this device only. |
| Deepgram API key | Your own key is stored locally in your browser and is never bundled in the code. |
| Default voice per service | Choose the default voice separately for each service. |
| Speed | Default playback rate (1×–2×). |
| Advanced API base URL | Leave this empty to use the default. |

You can also switch voices directly from the floating bar while reading.

## Privacy

- The text of the blocks you read is sent only to the voice service you selected: `api.brauo.com` in Brauo Cloud mode or `api.deepgram.com` in Deepgram mode.
- Keys never leave your browser except to authenticate with the selected service.
- Brauo has no analytics and no tracking.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Notes

- Version 0.2.0 adds Brauo Cloud mode alongside the original bring-your-own-key mode.
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
Pick Brauo Cloud in Options, paste a key, and click Save.
Open a long article and read it end to end with no Deepgram key configured.
Confirm the service worker network log shows only `api.brauo.com` requests.
Read the same paragraph again and confirm it starts noticeably faster and the service reports a cache hit via the `X-Brauo-Cache` response header.
Switch to the Deepgram service with a Deepgram key and confirm reading still works.
Confirm `git grep brauo_sk_` finds only documentation placeholders.

## License

[MIT](LICENSE) © Andres Lee
