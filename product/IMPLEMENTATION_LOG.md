# Product implementation log

## 2026-09-13 — Local-first MVP

### Completed

- Created a Vite, React, and TypeScript Manifest V3 extension build.
- Implemented background-owned IndexedDB storage for preferences, settings, and bounded usage-decision logs.
- Added separate classifier, extractor, updater, retriever, ranker, and context compiler components.
- Added deterministic specificity precedence and current-turn override suppression.
- Added ChatGPT and Claude provider adapters plus a disabled Gemini placeholder.
- Added a profile dashboard, compact popup, import/export, per-domain controls, lifecycle controls, and internal experiment conditions.
- Aligned JSON portability with the research profile schema version `0.1.0`.
- Added poisoning controls: assistant messages and page content are not observed, only trusted composer input can create evidence, raw evidence is excluded from profile export, and imported values are bounded before compilation.

### Decisions

- Keep the profile inside the extension origin. Content scripts receive only the compiled instruction and usage decisions, not the complete profile.
- Use deterministic, inspectable rules for the MVP rather than remote inference.
- Put compiled preferences before the untouched authoritative current request.
- Do not enable Gemini until live selector and submit behavior are validated.
- Preserve locked same-ID local records during a merge import; replacement remains an explicit user action.

### Next work

- Browser-level smoke tests against live provider UI revisions.
- Session-only preferences and expiry boundaries.
- Better correction-to-previous-domain linking across navigation and multiple tabs.
- Semantic import conflict review for different IDs asserting the same scoped dimension.
- Usability testing and research experiments; no effectiveness claim is made yet.

### Verification

- `npm run typecheck`: passed
- `npm run lint`: passed with zero warnings
- `npm test`: 26 tests passed across 8 files after integration review
- `npm run build`: produced the Manifest V3 unpacked extension
- `npm audit`: zero known vulnerabilities after upgrading the test runner

### Integration review additions

- Distinguish durable explicit wording from weaker correction evidence; one implicit correction remains below the retrieval threshold and repeated evidence accumulates.
- Filter inferred records using decayed effective confidence rather than stale stored confidence.
- Added regression coverage for explicit/implicit source authority, repeated correction activation, and stale-preference withholding.
