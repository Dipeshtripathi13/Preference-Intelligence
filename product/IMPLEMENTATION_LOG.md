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

## 2026-09-13 — Preference Intelligence product proof

### Completed

- Audited the working repository before refactoring and preserved the canonical
  profile → provider-neutral compiler → thin-adapter architecture.
- Added a distinct applicability gate with inspectable scope, semantic relevance,
  evidence-confidence, and final-applicability components.
- Made disabled, condition-ineligible, expired, ambiguous, low-confidence,
  irrelevant, less-specific, budget-excluded, and current-overridden preferences
  visible as bounded local decisions.
- Closed the ambiguous-preference leakage bug: unresolved conflict now always
  abstains.
- Added named evidence tiers, update events, direct-statement precedence, repeated
  correction reinforcement, conflict rationale, lock-conflict visibility, and
  temporary expiration round-trip.
- Implemented a context-specific “wasn't relevant here” correction that preserves
  the underlying preference and exports/imports as scoped negative evidence.
- Expanded deterministic classification for fixed income and Kubernetes
  infrastructure and exposed multi-domain candidates.
- Rebuilt the public product around guided Java/finance switching, visible
  abstention, a three-step learning loop, four-provider comparison, pre-generated
  response disclosure, privacy, status, UPP import/export, and expandable profile
  inspection.
- Added a compact shadow-DOM indicator to ChatGPT/Claude pages and a richer
  dashboard trace for applied and rejected candidates.
- Hardened adapter failure handling for missing/disabled send controls and added a
  repeatable manual live-DOM test plan.

### Decisions

- “Evidence confidence” and “contextual applicability” remain separate. Neither
  is presented as a calibrated probability of response benefit.
- Locked values receive authority but never bypass scope or applicability.
- Negative applicability feedback is scoped and reversible; it does not globally
  punish a correct preference.
- Public provider outputs remain static, representative artifacts with permanent
  disclosure. The GitHub Pages site contains no provider credentials or live API.
- Multi-domain alternatives are exposed now, while single-primary selection is
  retained as an explicit MVP limitation.

### Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed with zero warnings.
- `npm test -- --run`: 47 tests passed across 11 files.
- `npm run build`: passed; relative production assets emitted.
- Built demo rendered in headless Chrome at desktop viewport.
- Live ChatGPT/Claude DOM validation remains a documented manual task and is not
  represented as completed.
