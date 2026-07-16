# Chrome Web Store submission checklist

## 1. Prerequisites

- [ ] Sign in to the Chrome Web Store Developer Dashboard with the account that will own Brauo.
- [ ] Keep the privacy policy URL ready: `https://brauo.com/privacy`.

## 2. Get the package

Preferred: download the exact package that GitHub Actions built and attested for the matching tag.
It carries a build-provenance attestation and is byte-for-byte the release artifact.

```bash
gh release download v0.14.0 -R andresleecom/brauo -p "brauo-0.14.0.zip"
```

Alternative: rebuild locally with one of the command sets below, from the repository root.
The commands remove only an older archive with the same name before creating a clean package.

### Git Bash

```bash
rm -f brauo-0.14.0.zip
zip -r brauo-0.14.0.zip manifest.json background.js content.js content.css options.html options.js popup.html popup.js shared.js voices.js icons _locales
```

### PowerShell

```powershell
Remove-Item -LiteralPath .\brauo-0.14.0.zip -Force -ErrorAction SilentlyContinue
$packageFiles = @(
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'options.html',
  'options.js',
  'popup.html',
  'popup.js',
  'shared.js',
  'voices.js',
  'icons',
  '_locales'
)
Compress-Archive -LiteralPath $packageFiles -DestinationPath .\brauo-0.14.0.zip
```

- [ ] Confirm that `brauo-0.14.0.zip` contains only `manifest.json`, `background.js`, `content.js`, `content.css`, `options.html`, `options.js`, `popup.html`, `popup.js`, `shared.js`, `voices.js`, `icons/`, and `_locales/`.
- [ ] Confirm that `_locales/en/messages.json` and `_locales/es/messages.json` are inside the archive.
- [ ] Open the existing item in the Developer Dashboard (do not create a new item; the listing is one item).
- [ ] If a previous version is Pending review, cancel that submission first so the new version can be uploaded.
- [ ] Open the Package tab and upload `brauo-0.14.0.zip` as a new package version.
- [ ] Confirm that the detected version is `0.14.0`.

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
Point, click, and listen. Read any web page aloud with natural voices via Brauo Cloud.
```

Full description:

```text
Point at a paragraph, click, and listen.

Brauo reads any web page aloud with natural voices via Brauo Cloud.
Click the Brauo icon in the browser toolbar to open Brauo, then choose Read this page.
Point at a paragraph and click to choose where reading should begin.
Brauo continues through the document, highlights the current block, keeps it in view, and preloads upcoming audio for smooth playback.

Use the floating controls to pause, resume, stop, switch voices, or adjust playback speed from 1x to 2x.
Tables are read row by row, and long paragraphs are split at sentence boundaries.

Get a free Brauo API key at https://brauo.com, then paste it in the extension's Options page.
The free tier includes approximately 20 credits per day.
The API key is stored locally in your browser and is sent only to api.brauo.com to authenticate requests.

Brauo respects your privacy.
It has no analytics, no tracking, and no ads.
Only the text you choose to read is sent to Brauo Cloud to generate audio, and page URLs are not sent.

Brauo is open source: https://github.com/andresleecom/brauo
```

### Spanish listing

Title:

```text
Brauo - Lectura en voz alta
```

Summary:

```text
Apunta, haz clic y escucha. Lee cualquier página web en voz alta con voces naturales mediante Brauo Cloud.
```

Full description:

```text
Apunta a un párrafo, haz clic y escucha.

Brauo lee cualquier página web en voz alta con voces naturales mediante Brauo Cloud.
Haz clic en el icono de Brauo en la barra de herramientas del navegador para abrir Brauo y elegir leer la página actual.
Apunta a un párrafo y haz clic para elegir dónde debe comenzar la lectura.
Brauo continúa por el documento, resalta el bloque actual, lo mantiene visible y precarga el próximo audio para ofrecer una reproducción fluida.

Usa los controles flotantes para pausar, reanudar o detener la lectura, cambiar de voz o ajustar la velocidad de reproducción de 1x a 2x.
Las tablas se leen fila por fila y los párrafos largos se dividen en los límites de las oraciones.

Obtén una clave gratuita de la API de Brauo en https://brauo.com y pégala en la página de Opciones de la extensión.
El nivel gratuito incluye aproximadamente 20 créditos al día.
La clave de la API se guarda localmente en tu navegador y solo se envía a api.brauo.com para autenticar las solicitudes.

Brauo respeta tu privacidad.
No incluye analíticas, seguimiento ni anuncios.
Solo se envía a Brauo Cloud el texto que eliges leer para generar el audio, y no se envían las URL de las páginas.

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
Choose your preferred voice and playback speed in Options.
```

Screenshot 2 caption in Spanish:

```text
Elige la voz preferida y la velocidad de reproducción en Opciones.
```

## 5. Privacy tab

### Single purpose statement

```text
Brauo reads aloud the text of the web-page blocks the user chooses. The user clicks the Brauo toolbar icon, chooses Read this page, points at a paragraph, and Brauo reads from there with natural voices.
```

### Permission justifications

Storage permission:

```text
The storage permission saves the user's Brauo API key and preferred voice in the browser.
The API key is stored locally and is sent only to api.brauo.com to authenticate requests.
```

Host permission for `https://api.brauo.com/*`:

```text
This host permission lets the extension send the text the user chooses to read and the selected voice to Brauo Cloud, then receive the generated audio.
The user's Brauo API key is sent to this host only to authenticate the request.
Page URLs are not sent.
```

activeTab and scripting permissions:

```text
The activeTab and scripting permissions let Brauo inject its reading interface into the current tab only after the user clicks the Brauo toolbar button.
Brauo requests no access to any site until that click, and it accesses only the tab the user activated.
```

### Remote code

- [ ] Select that the extension does not use remote code.

Remote code explanation, if the dashboard requests one:

```text
Brauo uses no remote code.
All executable JavaScript is included in the extension package.
Brauo Cloud returns generated audio, not executable code.
```

### Data usage

- [ ] Check Website content.
- [ ] Describe Website content as the text the user chooses to read.
- [ ] Check Authentication information.
- [ ] Describe Authentication information as the user-provided Brauo API key stored locally in the browser and used only with api.brauo.com.
- [ ] Certify that the data is not sold or transferred for purposes unrelated to the single purpose.
- [ ] Certify that the data is not used or transferred for personalized advertising.
- [ ] Certify that the data is not used or transferred for creditworthiness or lending purposes.
- [ ] Certify compliance with the Chrome Web Store User Data Policy, including the Limited Use requirements.
- [ ] Enter `https://brauo.com/privacy` as the privacy policy URL.

## 6. Reviewer notes box

Paste the following reviewer notes:

```text
Brauo's entry point is the Brauo icon in the browser toolbar.
Clicking the icon opens a small Brauo popup. With an API key set, the popup shows the plan and remaining credits and a Read this page button; without a key, the popup lets the user paste one.
Click Read this page to load the reader into the current tab, then move the pointer over readable blocks and click a block to begin reading from that point.
The floating bar then provides pause, resume, stop, voice, and speed controls.

Brauo requires a free API key from https://brauo.com. The key is entered in the popup or on the Options page and stored locally in the browser.
No credential is bundled in the extension or published in the repository.

Test key (free tier) for review — replace the placeholder before submitting:
<PASTE THE REVIEW API KEY HERE>
It authenticates requests to api.brauo.com; the key is not committed to the repository and can be revoked after review.
```

## 7. Distribution tab

- [ ] Select Public visibility.
- [ ] Make the listing available in all regions.
- [ ] Save the Distribution tab.
- [ ] Review every dashboard warning and resolve any incomplete required field before submission.

## 8. After submit

- [ ] Submit the item for review after the Package, Store listing, Privacy, and Distribution tabs show complete.
- [ ] Watch the developer-account email address for questions, approval, or a rejection notice.

If the item is rejected, read the cited policy and compare the dashboard disclosures with the package behavior before replying.
Answer with the relevant permission justification from this checklist, explain the user-triggered point-click-listen flow, and identify the exact text or package change made if a correction was necessary.
Do not add a new claim merely to obtain approval.
Keep the store listing, privacy disclosures, privacy policy, and actual extension behavior consistent, then upload a corrected higher version and resubmit when required.

## 9. Re-taking screenshots

Run `node store/render-assets.mjs` from the repository root to regenerate all store graphics.

Manual alternative: set the browser content area to 1280x800 and capture the Options page and a real article page.
Configure a working key, start reading the real page, and capture a live `Reading N / M` state with the active paragraph and controls visible.
