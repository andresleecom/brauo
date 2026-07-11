# Chrome Web Store submission checklist

## 1. Prerequisites

- [ ] Sign in to the Chrome Web Store Developer Dashboard with the account that will own Brauo.
- [ ] Register the developer account and pay the one-time USD 5 registration fee.
- [ ] Keep the current privacy policy URL ready: `https://github.com/andresleecom/brauo/blob/main/PRIVACY.md`.
- [ ] Replace that URL with `https://brauo.com/privacy` after the page exists and contains the same current policy.

## 2. Build the package

Run one of the following command sets from the repository root.

The commands remove only an older archive with the same name before creating a clean package.

### Git Bash

```bash
rm -f brauo-0.2.1.zip
zip -r brauo-0.2.1.zip manifest.json background.js content.js content.css options.html options.js shared.js voices.js icons _locales
```

### PowerShell

```powershell
Remove-Item -LiteralPath .\brauo-0.2.1.zip -Force -ErrorAction SilentlyContinue
$packageFiles = @(
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'options.html',
  'options.js',
  'shared.js',
  'voices.js',
  'icons',
  '_locales'
)
Compress-Archive -LiteralPath $packageFiles -DestinationPath .\brauo-0.2.1.zip
```

- [ ] Confirm that `brauo-0.2.1.zip` contains only `manifest.json`, `background.js`, `content.js`, `content.css`, `options.html`, `options.js`, `shared.js`, `voices.js`, `icons/`, and `_locales/`.
- [ ] Confirm that `_locales/en/messages.json` and `_locales/es/messages.json` are inside the archive.
- [ ] Open the Package tab in the Developer Dashboard.
- [ ] Upload `brauo-0.2.1.zip` as a new item.
- [ ] Confirm that the detected version is `0.2.1`.

## 3. Store listing tab

- [ ] Configure English and Spanish as listing languages.
- [ ] Use English as the primary language.
- [ ] Select the Accessibility category.

### English listing

Title:

```text
Brauo - Read Aloud
```

Summary:

```text
Point, click, and listen. Natural text to speech for any page with Brauo Cloud voices or your own Deepgram key.
```

Full description:

```text
Point at a paragraph, click, and listen.

Brauo reads any web page aloud with natural voices.
Click the floating speaker bubble, move over the page, and choose where reading should begin.
Brauo continues through the document, highlights the current block, keeps it in view, and preloads upcoming audio for smooth playback.

Use the floating controls to pause, resume, stop, switch voices, or adjust playback speed from 1x to 2x.
Tables are read row by row, and long paragraphs are split at sentence boundaries.

Choose voices from Brauo Cloud with one key, or bring your own Deepgram key.
Your keys are stored in your browser and are sent only to authenticate with the voice service you select.

Brauo respects your privacy.
It has no analytics, no tracking, and no ads.
Only the text you choose to read is sent to the selected voice service, and page URLs are not sent.

Brauo is open source: https://github.com/andresleecom/brauo
```

### Spanish listing

Title:

```text
Brauo - Lectura en voz alta
```

Summary:

```text
Apunta, haz clic y escucha. Texto a voz natural para cualquier página con voces de Brauo Cloud o tu propia clave de Deepgram.
```

Full description:

```text
Apunta a un párrafo, haz clic y escucha.

Brauo lee cualquier página web en voz alta con voces naturales.
Haz clic en la burbuja flotante del altavoz, recorre la página y elige dónde debe comenzar la lectura.
Brauo continúa por el documento, resalta el bloque actual, lo mantiene visible y precarga el próximo audio para ofrecer una reproducción fluida.

Usa los controles flotantes para pausar, reanudar o detener la lectura, cambiar de voz o ajustar la velocidad de reproducción de 1x a 2x.
Las tablas se leen fila por fila y los párrafos largos se dividen en los límites de las oraciones.

Elige voces de Brauo Cloud con una sola clave o usa tu propia clave de Deepgram.
Tus claves se guardan en el navegador y solo se envían para autenticarte con el servicio de voz que elijas.

Brauo respeta tu privacidad.
No incluye analíticas, seguimiento ni anuncios.
Solo se envía al servicio de voz seleccionado el texto que eliges leer, y no se envían las URL de las páginas.

Brauo es de código abierto: https://github.com/andresleecom/brauo
```

## 4. Graphic assets

- [ ] Upload `icons/icon128.png` as the store icon.
- [ ] Upload `store/screenshot-reading-1280x800.png` as screenshot 1.
- [ ] Upload `store/screenshot-options-1280x800.png` as screenshot 2.
- [ ] Upload `store/promo-440x280.png` as the small promo tile.

Screenshot 1 caption in English:

```text
Click any paragraph and follow along as Brauo reads the page aloud.
```

Screenshot 1 caption in Spanish:

```text
Haz clic en cualquier párrafo y sigue el texto mientras Brauo lee la página en voz alta.
```

Screenshot 2 caption in English:

```text
Choose your voice service, preferred voice, and playback speed in Options.
```

Screenshot 2 caption in Spanish:

```text
Elige el servicio de voz, la voz preferida y la velocidad de reproducción en Opciones.
```

## 5. Privacy tab

### Single purpose statement

```text
Brauo reads aloud the text of pages the user chooses.
```

### Permission justifications

Storage permission:

```text
The storage permission saves the user's selected voice service, preferred voice, playback speed, and user-provided API keys in the browser.
The keys are sent only to authenticate requests with the voice service selected by the user.
```

Host permission for `https://api.brauo.com/*`:

```text
This host permission lets the extension send only the text the user chooses to read and the selected voice ID to Brauo Cloud for speech synthesis.
The user's Brauo Cloud key is sent to this host only to authenticate the request.
Page URLs are not sent.
```

Host permission for `https://api.deepgram.com/*` in bring-your-own-key mode:

```text
This host permission is used only when the user chooses the bring-your-own-key voice service.
It lets the extension send the text the user chooses to read, the selected voice ID, and the user's own API key directly to that service for speech synthesis and authentication.
Page URLs are not sent.
```

Content script on all sites:

```text
Brauo can be invoked to read on any page, so its content script must display the reading bubble, identify readable text blocks, highlight the chosen block, and provide playback controls on all sites.
The extension reads page content only when the user clicks the bubble and then chooses where to start reading.
It collects no browsing history, analytics, or other browsing data.
```

### Remote code

- [ ] Select that the extension does not use remote code.

Remote code explanation, if the dashboard requests one:

```text
Brauo uses no remote code.
All executable JavaScript is included in the extension package.
Remote services return synthesized audio, not executable code.
```

### Data usage

- [ ] Check Website content.
- [ ] Describe Website content as the text the user chooses to read.
- [ ] Check Authentication information.
- [ ] Describe Authentication information as user-provided API keys stored in the browser and used only with the selected voice service.
- [ ] Certify that the data is not sold or transferred for purposes unrelated to the single purpose.
- [ ] Certify that the data is not used or transferred for personalized advertising.
- [ ] Certify that the data is not used or transferred for creditworthiness or lending purposes.
- [ ] Certify compliance with the Chrome Web Store User Data Policy, including the Limited Use requirements.
- [ ] Enter `https://github.com/andresleecom/brauo/blob/main/PRIVACY.md` as the privacy policy URL.
- [ ] Replace it with `https://brauo.com/privacy` after that page exists.

## 6. Reviewer notes box

Paste the following reviewer notes:

```text
Brauo's entry point is the floating speaker bubble that appears near the lower-right corner of ordinary web pages.
Click the bubble to enter reading mode, move the pointer over readable blocks, and click a block to begin reading from that point.
The floating bar then provides pause, resume, stop, voice, and speed controls.

Cloud mode requires a Brauo Cloud API key, which is entered on the extension's Options page and stored in the browser.
No credential is bundled in the extension or published in the repository.
If test credentials are required, please request them through the review channel.
We will issue a temporary Brauo Cloud key for review and revoke it after the review is complete.
```

## 7. Distribution tab

- [ ] Select Public visibility.
- [ ] Make the listing available in all regions.
- [ ] Leave pricing set to free.
- [ ] Save the Distribution tab.
- [ ] Review every dashboard warning and resolve any incomplete required field before submission.

## 8. After submit

- [ ] Submit the item for review after the Package, Store listing, Privacy, and Distribution tabs show complete.
- [ ] Watch the developer-account email address for questions, approval, or a rejection notice.

Most extensions are reviewed within a few days.
Review can take up to a few weeks, especially for a new extension or one with broad host access.
If the item remains pending for more than three weeks, contact Chrome Web Store developer support.

If the item is rejected, read the cited policy and compare the dashboard disclosures with the package behavior before replying.
Answer with the relevant permission justification from this checklist, explain the user-triggered point-click-listen flow, and identify the exact text or package change made if a correction was necessary.
Do not add a new claim merely to obtain approval.
Keep the store listing, privacy disclosures, privacy policy, and actual extension behavior consistent, then upload a corrected higher version and resubmit when required.

Planned follow-up:

Switching to an action button with `activeTab` in a future update is a permission reduction and is safe after publish.

## 9. Re-taking screenshots

Run `node store/render-assets.mjs` from the repository root to regenerate all store graphics.

Manual alternative: set the browser content area to 1280x800 and capture the Options page and a real article page.
Configure a working key, start reading the real page, and capture a live `Reading N / M` state with the active paragraph and controls visible.
