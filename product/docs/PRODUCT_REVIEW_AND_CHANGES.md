# Product review and changes

Date: 2026-09-13  
Public product: <https://dipeshtripathi13.github.io/Preference-Intelligence/>  
Historical baseline audit: [`CURRENT_PRODUCT_AUDIT.md`](CURRENT_PRODUCT_AUDIT.md)

## Original problem

The repository already contained a sound local-first preference engine, Chrome
extension, dashboard, portable profile, experiment harness, and public compiler.
The public experience nevertheless looked primarily like a profile administration
screen. It told visitors that preferences were contextual and portable without
showing response behavior, deliberate non-application, a learning transition, or
meaningful provider comparison.

Two engine gaps also weakened the claim. Contextual applicability was implicit in
exact scope filtering, so rejected preferences vanished from the trace, and an
`ambiguous` record could pass retrieval despite documentation promising
abstention.

## Criticism applied

- Lead with the user problem and observable behavior, not architecture or CRUD.
- Treat preference confidence and request relevance as different quantities.
- Make abstention and current-request override visible rather than silently
  dropping candidates.
- Demonstrate an actual correction → update → changed-future-response loop.
- Show one canonical profile across models without pretending static examples are
  live provider calls.
- Keep control local, reversible, and understandable without architecture docs.
- Preserve honest evidence boundaries: product mechanisms are implemented, but
  improved subjective answer quality is not established.

## What changed

| Area | Before | After | Main files |
|---|---|---|---|
| Public experience | Editor-first compiler with a cosmetic provider selector | Thesis-first landing page with guided domain, abstention, learning, response, portability, privacy, and status flows | `src/demo/App.tsx`, `src/demo/styles.css` |
| Domain scenario | Manual prompt entry only | Java and fixed-income presets show different applied profiles and explicit non-leakage | demo app, `domainClassifier.ts` |
| Abstention | Unrelated records disappeared | Every bounded candidate can produce a local `suppressed_*` decision with a reason | `retriever.ts`, `types.ts` |
| Learning | No update delta in the UI; locked demo records | Unlocked 52% intermediate infrastructure record changes to advanced after a direct correction, and the next operator answer changes | `updater.ts`, `extractor.ts`, `engine.ts`, demo app |
| Applicability | Scope and confidence conflated | Separate deterministic `ApplicabilityEvaluator` reports scope match, semantic relevance, evidence confidence, and final applicability | `applicabilityEvaluator.ts` |
| Conflict safety | Ambiguous records could compile | Ambiguous/conflicted records always abstain; update events explain direct replacement, ambiguity, and lock conflicts | `updater.ts`, `retriever.ts` |
| Evidence model | Explicit/implicit only | Named direct-statement, direct-correction, repeated-correction, interaction-pattern, dashboard, and import tiers | `types.ts`, `updater.ts`, confidence-model docs |
| Preference lifetime | Request-only language merely skipped persistence | Current-request behavior plus durable/temporary/locked record concepts and portable expiration metadata | `types.ts`, `extractor.ts`, `profile.ts` |
| Wrong personalization | No contextual correction | “Wasn't relevant here” stores scoped negative applicability evidence without deleting the underlying preference | demo, in-page indicator, background, profile export/import |
| Provider portability | Provider selector changed copy text only | One profile branches to four status-labeled provider envelopes and clearly labeled pre-generated responses | demo app |
| Extension surface | No in-page status | Small isolated shadow-DOM indicator shows applied count, why/why-not details, and contextual relevance feedback | `content/indicator.ts`, `content/index.ts` |
| Dashboard | Generic confidence and applied-only reason | Evidence-confidence wording, suppression/applicability scores, corrections, privacy panel, and developer selection trace | `dashboard/App.tsx`, `dashboard/styles.css` |
| Adapters | Happy-path selector fixtures | Disabled/missing-submit failure handling, nested submit target, and unsupported-origin tests | `providers/`, `providers.test.ts` |
| Portable profile | No public import; expiration discarded | Validated public import, expiration round-trip, and portable negative applicability evidence | `profile.ts`, demo app |

## Resulting public behavior

The landing flow now follows:

```text
Canonical local profile
  → current prompt
  → detected domain / subdomain / task
  → applicability gate
  → applied and suppressed preferences
  → compact provider-neutral context
  → clearly labeled pre-generated response behavior
```

The profile editor remains available lower on the page as an expandable inspector.
It is no longer the primary product story.

## Research concept → component → measurement

| Research concept | Implemented component | Experimental measurement |
|---|---|---|
| Domain conditioning | `DomainClassifier`, `PreferenceRetriever` | Condition D versus E; domain-leakage rate |
| Contextual applicability | `ApplicabilityEvaluator`, negative scoped evidence | Relevant-preference precision/recall, false-application harm, abstention coverage |
| Evidence-aware learning | `PreferenceExtractor`, `PreferenceUpdater`, update events | Calibration, activation delay, correction burden, drift recovery |
| Compact representation | `ContextCompiler`, eight-dimension cap | Input tokens, output tokens, latency, truncation, total cost |
| Cross-model portability | Canonical UPP profile plus thin adapters | Per-provider behavioral conformance and heterogeneity |
| User governance | Dashboard, locks, overrides, contextual rejection, import/export | Perceived agency, predictability, undo success, error recovery |
| Safety boundary | Trusted-composer provenance and bounded ontology | Poisoning success, sensitive-inference violations, unrelated-preference leakage |

The implementation made one distinction especially concrete: **preference
inference error** (“this stored value is wrong”) differs from **preference
applicability error** (“this value is right, but not here”). The new contextual
negative-evidence path is an implementable and testable form of the latter.

## Files modified

The change spans the engine (`types`, classifier, extractor, updater,
applicability, retriever, compiler, engine, profile), public demo, dashboard,
content script, background trust boundary, provider adapters, automated tests,
product/research documentation, and paper framing. See the Git diff for the exact
versioned list.

## Verification

- Product TypeScript check: passed.
- Product ESLint check: passed with zero warnings.
- Product automated suite: 47 tests passed across 11 files.
- Production Vite/esbuild build: passed; all site assets use relative paths.
- Headless Chrome production render: passed at desktop viewport with no page-load
  failure; hero and guided workbench rendered from the built artifact.
- Research Python suite: 29 tests passed; Ruff and strict mypy passed.
- GitHub Pages: verify the deployed commit and asset responses after push before
  calling deployment complete.

## Remaining limitations

Preference Intelligence does not currently:

- replace model-native factual memory or synchronize full conversation history;
- guarantee that an inferred preference is correct or that applying it helps;
- guarantee identical behavior across heterogeneous models;
- use a semantic/embedding fallback after deterministic classification;
- fully personalize both domains of a multi-domain prompt (alternatives are
  exposed, but one primary domain drives selection);
- implement session teardown semantics beyond current-request versus persisted
  lifetime representation;
- reconcile semantic duplicates with different IDs during profile merge;
- provide cloud sync or a mandatory backend;
- infer sensitive demographic profiles;
- establish improved subjective quality without target-user evaluation.

ChatGPT and Claude are adapter- and fixture-tested, but provider DOMs change and
still require live smoke testing. Gemini remains an intentionally unenabled
placeholder. Public model responses are pre-generated and always labeled as such.

## Next steps

1. Run the documented live ChatGPT/Claude manual smoke matrix on each UI release.
2. Conduct a storage-v2 migration/corrupt-record quarantine design before adding
   more persisted fields.
3. Add a conservative local semantic fallback and evaluate calibration rather
   than assuming it improves classification.
4. Run the preregistered, ethics-reviewed target-user study with blinded response
   comparison and independent correctness/safety review.
5. Calibrate evidence and applicability thresholds on held-out user confirmations.
6. Evaluate total token/latency cost and behavioral conformance across additional
   model snapshots; do not optimize input length alone.
