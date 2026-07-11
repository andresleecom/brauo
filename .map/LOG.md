# MAP log: Brauo Cloud mode (E1)

| # | Task | Strikes | Verdict | Commit |
|---|------|---------|---------|--------|
| 01 | Shared constants/defaults module | 0 | pass (sandbox-retry: danger-full-access needed on this host) | bec142c |
| 02 | Audio cache by hash(text+voice) | 0 | pass | eca9581 |
| 03 | Provider layer Deepgram + BrauoCloud | 0 | pass | 1755137 |
| 04 | Storage migration + Options UI + mode-aware bar | 0 | pass (flow check deferred to Phase 3) | 76068cc |
| 05 | manifest + README dual mode | 0 | pass (reviewer polish: storage claim in Configuration intro) | fef0fe9 |
| 06 | Retry/backoff + cloud error messages + smoke checklist | 0 | pass (reviewer polish: smoke section moved above License) | db1c2ca |

Phase 3 notes:
- Full verify bar green: node --check on all 5 JS files, manifest JSON parse, secrets grep clean.
- CDP flow smoke on Chrome 150 headless (Extensions.loadUnpacked; --load-extension is dead on stable): 13/13 pass, zero console errors.
  Covered: fresh-install deepgram default, mode toggle, bundled cloud fallback, live GET /v1/voices through the worker, preview blocked without key, explicit Save, mode in sync with no cloud key in sync, deepgram refresh blocked without key, bar injection, neutral cloud hint, mode-aware bar voice list.
- Deferred to Andres (need real keys, never committed): full-page cloud read, X-Brauo-Cache hit on re-read, Deepgram BYO read regression.
- k8s smoke-key lookup denied by the session permission classifier; left to Andres per plan.
- Two-axis review (Standards + Spec sub-agents): no hard violations. Applied: header/rationale comments (shared.js, voices.js), msg.model compat comment (background.js), CORS note in the Advanced hint (options.html). Deliberately deferred: handler dedup in background/options (small, readable, verified), X-Brauo-Request-Id surfacing and error-code casing normalization (WS-2 support tooling), key-presence boolean in content script (parity with the pre-existing BYO pattern; isolated world shields page JS).
