# MAP log: Chrome Web Store prep (E2)

| # | Task | Strikes | Verdict | Commit |
|---|------|---------|---------|--------|
| 01 | PRIVACY.md + README link | 0 | pass (reviewer polish: preview sentence accuracy) | 38a52f6 |
| 02 | Store asset pipeline + rendered PNGs | 0 | pass (orchestrator ran renders; 2 art-direction tweaks: cloud voice in reading shot, Wikipedia banner removal) | 633bfa7 |
| 03 | _locales en+es + manifest 0.2.1 | 0 | pass | 6d29a3a |
| 04 | CHANGELOG + README store section | 0 | pass (reviewer polish: two wording fixes) | 1f5e70a |
| 05 | SUBMIT.md checklist + bilingual listing copy | 0 | pass (reviewer polish: Distribution promoted to its own section, renumbered) | 6f53c99 |

Phase 3 notes:
- Full verify bar green: node --check on 6 JS files, manifest and both locale JSONs parse, secrets grep clean.
- Flow: render-assets.mjs ran green against the localized 0.2.1 manifest (Extensions.loadUnpacked + options + content bar); regenerated PNGs byte-identical to the committed ones.
- Executor: codex gpt-5.6-sol with danger-full-access throughout (host requirement, from MAP-05); zero strikes, zero sandbox retries this MAP.
- Deferred by design: D01 entry-point switch (action + activeTab) documented as post-publish follow-up in SUBMIT.md; brauo.com/privacy hosting note in SUBMIT.md prerequisites.
