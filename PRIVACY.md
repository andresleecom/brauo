# Brauo Privacy Policy

Effective date: 2026-07-11

## What Brauo does

Brauo is a Chrome extension that reads user-selected blocks of text aloud.
It sends text to the voice service the user selects so that service can synthesize audio.

## What data is processed and when

Brauo sends only the text of blocks the user chooses to read and the selected voice ID.
Nothing is sent until the user starts reading or plays a voice preview, and the preview sends only a fixed sample sentence, never page content.
Page URLs are not sent to the selected voice service.
The selected service also receives the API key needed to authenticate the request.

## Where your text goes

### Brauo Cloud

In Brauo Cloud mode, the selected text and voice ID are sent to `api.brauo.com`.
Brauo Cloud processes the text solely to synthesize audio for the read-aloud feature.
Brauo Cloud may rely on third-party speech and infrastructure providers to synthesize and deliver that audio.
Those providers process data only as needed to support the service.
Brauo Cloud records request IDs, character counts, and timestamps for quotas and billing.
Brauo Cloud may cache generated audio using a one-way fingerprint of the text plus the selected voice so repeated reads are faster.

### Bring your own Deepgram key

In Deepgram mode, the selected text and voice ID are sent directly to `api.deepgram.com` under the user's own account.
Deepgram receives the user's API key to authenticate the request.
Deepgram processes that data under its own privacy terms.

## API keys

API keys are stored in the browser using `chrome.storage`.
The Brauo Cloud key is stored only on the device in `chrome.storage.local`.
Keys are sent only to authenticate requests with the selected voice service.
They are not sent to the other voice service.
Uninstalling the extension removes everything the extension stored in the browser.

## What Brauo does not do

The extension collects no analytics.
The extension performs no tracking.
The extension collects no browsing history.
The extension displays no ads.
Brauo does not sell user data or anything else derived from it.

## Data retention

The extension itself does not retain the text sent for reading.
It stores API keys and extension settings only in the browser as described above.
Brauo Cloud may retain cached generated audio keyed by a one-way fingerprint of text plus voice to make repeated reads faster.
Brauo Cloud retains request IDs, character counts, and timestamps as usage metadata for quotas and billing.
Brauo Cloud does not receive page URLs.

## Limited Use

User data is used solely to provide the read-aloud purpose requested by the user.
User data is never sold.
User data is never used for advertising.
User data is never used to determine creditworthiness or for lending purposes.
Brauo's use and transfer of user data are consistent with the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Changes to this policy

This policy may be updated if Brauo's data practices or legal obligations change.
The effective date at the top will be updated when changes are made.

## Contact

For privacy questions, email hola@andreslee.com.
