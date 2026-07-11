# Task 06: Retry with backoff, cloud error messages, smoke checklist

## Goal
Transient failures (429, 5xx, network) no longer kill a reading session: the worker retries with backoff before giving up.
Gateway error codes map to clear, provider-neutral messages in cloud mode.
README gains the E1 smoke checklist.

## Context - read these first
- background.js - both providers call fetch directly; errors flow as brauoError(code, message) to {ok:false, code, error} responses shown in the bar status.
- Cloud error envelope: {"error":{"code","message"}}; known codes: invalid_key, voice_not_found, quota_exceeded, text_too_long. 429/5xx may carry no JSON body.
- content.js retry behavior already works at the cache level (task 02): a failed block is dropped from the cache, so the next click retries.

## Scope - you may edit
- background.js, shared.js, README.md

## Out of scope - do not touch
- content.js, options.js, options.html, voices.js, manifest.json

## Steps
1. background.js: add `async function fetchWithRetry(url, init, attempts = 3)`.
   Retries when fetch throws (network) or the response status is 429 or >= 500; other statuses return immediately.
   Delay between attempts: the Retry-After header in seconds when present and sane (cap 10s), else 700ms * 2^attempt plus up to 300ms random jitter.
   After the last attempt: return the last response if there is one, else throw brauoError("network", "Could not reach the voice service. Check your connection.").
2. Route every provider fetch (deepgram speak + catalog, cloud speak + catalog) through fetchWithRetry.
3. Cloud error mapping in one place (a code-to-message table used by BrauoCloudProvider when a response is not ok):
   - invalid_key: "Your Brauo Cloud API key was rejected. Check it in Options."
   - quota_exceeded: "You have reached your Brauo Cloud usage limit."
   - voice_not_found: "That voice is not available. Pick another voice in Options."
   - text_too_long: "This block is too long to synthesize."
   - status 429 after retries: "The voice service is busy. Try again in a moment."
   - status >= 500 after retries: "The voice service had a temporary problem. Try again."
   - anything else: the envelope message when present, else "Request failed (" + status + ")."
   Keep the thrown error's `code` set to the envelope code or "http_" + status. Deepgram messages keep their current format.
4. README.md: append a "## Smoke test" section (each sentence on its own line, no em dashes), the checklist a contributor can run:
   load unpacked; pick Brauo Cloud in Options, paste a key, Save; open a long article and read it end to end with no Deepgram key configured; the service worker network log shows only api.brauo.com requests; reading the same paragraph again starts noticeably faster (the service reports a cache hit via the X-Brauo-Cache response header); switch to the Deepgram service with a Deepgram key and confirm reading still works; `git grep brauo_sk_` finds only documentation placeholders.
5. shared.js: touch only if a constant genuinely belongs there; otherwise leave it alone.

## Verify before reporting
Run: `node --check background.js && node --check shared.js`
Paste the output in your REPORT under PROOF.

HARD RULES - violating any of these means your work is discarded:
- NO git commands of any kind (no commit, branch, push, reset, checkout, stash).
- NO dependency changes: no package installs, no lockfile edits, no tool installs.
- Edit ONLY within the scope listed above. If the fix requires touching anything
  else, STOP and explain in your REPORT instead of doing it.
- If blocked or uncertain, STOP and report - do not improvise around the spec.
- End your output with:
  ## REPORT
  STATUS: done | blocked
  FILES TOUCHED: <list>
  PROOF: <output of the verification commands you were asked to run>
  NOTES: <up to 10 lines: decisions made, anything the reviewer must know>
