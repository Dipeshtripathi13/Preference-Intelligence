# Current product audit

Audit date: 2026-09-13  
Baseline commit: `70b4b03`  
Scope: repository documentation, preference engine, storage, extension boundary,
provider adapters, dashboard, public playground, research/product contracts,
automated tests, production build, and deployed GitHub Pages artifact.

## Executive assessment

The existing architecture is worth preserving. It already separates a canonical,
local preference profile from provider-specific DOM adapters and implements a
bounded classify → retrieve → rank → compile → update loop. The largest weakness
is product proof: the public site exposes a capable profile editor and compiler,
but it does not visibly demonstrate different behavior across domains, rejected
preferences, learning updates, or one profile working across providers.

There are also two material engine issues. First, contextual applicability is
currently implicit in exact scope matching; candidates that do not match simply
disappear, so neither users nor researchers can inspect suppression. Second,
records marked `ambiguous` are not excluded by retrieval and can be compiled if
their confidence remains above threshold. This undermines the documented promise
that unresolved conflicts abstain.

## Feature-by-feature audit

| Feature | Implementation status | Relevant files | Working? | Problems | Priority | Recommended fix |
|---|---|---|---|---|---|---|
| Product positioning | Implemented in documentation; partial in public UI | `README.md`, `product/README.md`, `src/demo/App.tsx` | Partly | Correctly rejects generic-memory positioning, but the demo mostly states rather than demonstrates the thesis. | P1 | Lead with an interactive domain-conditioned before/after flow and move profile administration lower. |
| Local-first storage | Implemented | `engine/store.ts`, ADR 0001 | Yes | IndexedDB v1 has no migration or corrupt-record quarantine path. | P2 | Add defensive normalization/migration tests before schema expansion; retain no-backend default. |
| Typed bounded preference ontology | Implemented | `engine/types.ts`, `contextCompiler.ts` | Yes | Twelve useful dimensions exist, but terminology such as “confidence” can look calibrated when it is only evidence support. | P1 | Label it “evidence confidence” and keep compiler values allowlisted. |
| Hierarchical scope | Implemented | `types.ts`, `retriever.ts` | Yes for exact matching | Global/domain/subdomain/task records work, but subdomain matching is all-or-nothing and sibling relevance is not assessed. | P1 | Keep deterministic scope gates and add a distinct, inspectable applicability evaluation. |
| Domain classification | Implemented, conservative | `domainClassifier.ts` | Partly | Single-domain only; finance has no fixed-income subdomain; Kubernetes/infrastructure vocabulary is absent; ties are not exposed. | P1 | Expand high-confidence rules, add fixed-income and infrastructure, expose alternative domains, and abstain to general when uncertain. |
| Preference applicability | Documented concept; not a separate implementation | `retriever.ts`, research gap docs | No distinct evaluator | Preference confidence and relevance are conflated in one score/reason. No semantic/task compatibility score exists. | P1 | Introduce a small deterministic `ApplicabilityEvaluator` returning scope, task, relevance, final score, and a reason. |
| Suppressed-preference trace | Partially typed but not produced | `types.ts`, `retriever.ts`, `engine.ts` | No | `UsageDecision` has `disabled`, but the retriever discards mismatches, disabled, stale, ambiguous, and condition-ineligible records without decisions. | P1 | Return selected and suppressed evaluations; log/display bounded explanations without injecting them. |
| Ranking and prompt budget | Implemented | `ranker.ts` | Yes | Hard record limit of eight is tested indirectly, but no explicit token cap or rejection trace is exposed. | P2 | Retain limit, add compiled-character/token cap and `budget_exceeded` suppression. |
| Compact provider-neutral compiler | Implemented | `contextCompiler.ts` | Yes | Templates are safe and bounded. The research pilot shows shorter input can still induce longer output. | P1 | Display measured input/output trade-off and keep output behavior in the evaluation contract. |
| Current-request precedence | Implemented and tested | `extractor.ts`, `contextCompiler.ts`, `contextCompiler.test.ts` | Yes | Pattern coverage is necessarily incomplete. | P1 | Preserve; add explicit long-answer, beginner-for-this-turn, and session-language cases. |
| Explicit preference learning | Implemented | `extractor.ts`, `updater.ts` | Yes for bounded phrases | Explicit signals usually activate after one event. Extractor coverage misses the Kubernetes correction requested in the demo brief. | P1 | Expand bounded patterns and emit an inspectable update result. |
| Repeated weak-signal learning | Implemented minimally | `extractor.ts`, `updater.ts`, `engine.test.ts` | Yes for repeated “make it shorter” | Evidence tiers are only explicit versus implicit; “show implementation” and broader repeated patterns are missing. | P1 | Add documented evidence kinds/authority and tests for repeated code and depth corrections. |
| Conflict handling | Implemented but unsafe | `updater.ts`, `retriever.ts`, `updater.test.ts` | Broken for abstention | Contradiction marks a record ambiguous, but retriever still selects ambiguous records; reasons are not retained for display. | P0 | Never compile ambiguous records; record the competing value and conflict-resolution rationale. |
| Temporary versus durable intent | Partial | `extractor.ts` | Partly | Current-only phrases are prevented from durable learning, but session/temporary lifetimes are not represented or stored. | P2 | Add request/session/durable evidence lifetime without changing UPP major version until migration is specified. |
| Locked preference protection | Implemented and tested | `updater.ts`, `updater.test.ts` | Yes | Contradictory evidence against a lock is silently ignored, so review visibility is lost. | P2 | Preserve the locked value and log a non-mutating conflict event. |
| Provenance and user-only authority | Implemented and tested | `extractor.ts`, `profile.ts`, trust-boundary tests | Yes | Provenance is intentionally a bounded signal label, not a raw excerpt; public demo currently cannot show a readable evidence event. | P1 | Show safe paraphrased signal/evidence metadata and clearly label prewritten demo excerpts. |
| Sensitive-attribute avoidance | Implemented by bounded ontology | `types.ts`, `extractor.ts`, security docs | Yes by construction | No explicit negative test enumerates prohibited traits. | P2 | Add tests proving sensitive claims and assistant-authored assertions create no record. |
| Profile export | Implemented | `profile.ts`, dashboard/demo | Yes | Public demo exports but does not import; generated profile IDs change per export. | P2 | Add validated import to the playground and explain UPP 0.1 draft status. |
| Profile import | Implemented in extension only | `profile.ts`, `background.ts`, dashboard | Yes for validated supported records | Merge reconciles by ID only, not `(dimension, scope)`; replace has no recoverable backup UI. | P2 | Keep current safe validation; expose limitations and add semantic-conflict workflow later. |
| Preference dashboard | Implemented | `dashboard/App.tsx` | Yes | Scope grouping and CRUD are clear, but “confidence” wording is imprecise and no suppression/conflict history is visible. | P1 | Use evidence-confidence language and join latest applied/suppressed decision with evidence details. |
| “Why was this used?” | Partially implemented | `dashboard/App.tsx`, usage logs | Partly | Applied/current-override reasons appear; unrelated or ambiguous preferences never enter logs, so “why not” is absent. | P1 | Populate suppression decisions and render scope, evidence count, last observed, source, applicability, and rationale. |
| Domain-conditioning demo | Engine behavior exists; public scenario incomplete | `demo/App.tsx`, `demo.test.tsx` | Partly | Java and finance prompts can select different records, but no preset scenario tabs, resulting behavior, or explicit non-leakage display exists. | P0 | Build guided Java and bond-duration examples with applied and suppressed lists plus labeled demonstration responses. |
| Abstention demo | Not implemented | Public demo | No | Unrelated preferences disappear rather than being visibly rejected. | P0 | Show Java expertise suppressed for bond convexity with the exact scope-mismatch reason. |
| Learning-loop demo | Engine behavior partial; UI absent | `demo/App.tsx`, engine | No coherent flow | Seeded preferences are locked, update deltas are not returned, and no follow-up prompt demonstrates changed behavior. | P0 | Add an unlocked intermediate infrastructure preference, guided correction, before/after update event, and follow-up operator prompt. |
| Provider comparison | Selector only | `demo/App.tsx` | Mostly cosmetic | Changing provider only changes a copy-button label; it does not expose a canonical profile or provider rendering/response. | P0 | Add provider tabs, one canonical profile, provider envelopes, and clearly labeled pre-generated responses. |
| Live versus pre-generated labeling | Not applicable currently | Public demo | Incomplete | The site makes no model call but also shows no response, so visitors cannot see outcome behavior. | P0 | Add representative pre-generated responses with a permanent “demonstration response—not live” label. |
| ChatGPT adapter | Implemented and unit-tested | `providers/chatgpt.ts`, manifest, provider tests | Mechanism works in fixtures | No current live-DOM verification; selector drift and controlled-editor behavior remain risks. | P1 | Add manual smoke-test procedure, multi-selector fixtures, visible graceful-fallback state, and periodic live check. |
| Claude adapter | Implemented and unit-tested | `providers/claude.ts`, manifest, provider tests | Mechanism works in fixtures | Same live-DOM and rich-text mutation risk as ChatGPT. | P1 | Same reliability work as ChatGPT before enabling more providers. |
| Gemini adapter | Placeholder, deliberately disabled | `providers/gemini.ts`, `providers/index.ts`, manifest | No live integration | It compiles but is neither enabled nor validated. | P3 | Keep labeled experimental in public demo; do not add host permissions until live validation. |
| In-page extension indicator | Not implemented | `content/index.ts`, popup | No | Normal provider pages give no subtle applied-count feedback; only the separate popup shows the latest log. | P2 | Add a small shadow-DOM/status indicator that opens bounded details and fails closed. |
| Experimental conditions | Implemented partly | settings, dashboard, research runner | Yes in extension for A/B/D/E | Extension lacks history-RAG condition C; research harness has all five. | P2 | Document the split; do not fake C in the extension. Add it only for consented studies with explicit data handling. |
| Experimental logging | Implemented | `engine.ts`, store, dashboard | Yes | Logs record selected/current-overridden decisions but not rejected candidates, model identifier, response, or actual provider tokens/latency. | P1 | Add suppression/applicability metadata now; response/token/latency require a consented API study path, not provider-page scraping. |
| Privacy explanation | Implemented in docs; minimal UI | footer/badge, security docs | Partly | Users cannot quickly see what is and is not stored. | P1 | Add a concrete local/not-stored panel and avoid calibrated-accuracy implications. |
| Research/product mapping | Distributed across docs | architecture, paper, experiment docs | Partly | No single concept → component → measurement map exists. | P2 | Add the mapping to the product review report and architecture docs. |
| Product status labels | Documentation only | READMEs | Partly | Public UI does not distinguish implemented, experimental, research, and unavailable capabilities. | P1 | Add a compact, honest capability-status section. |
| Public deployment | Implemented | Vite config, Pages workflow | Yes | Current production page returns HTTP 200 and assets load, but the experience is still editor-first. | P0 | Rebuild the landing flow, test production locally, deploy, and verify rendered scenarios and console. |
| Automated tests | Implemented | `product/extension/tests/` | 27 passing at baseline | Strong unit coverage of core happy paths; missing ambiguous suppression, applicability traces, lifetime, budget, multi-domain, malformed storage, and richer demo flow. | P1 | Add focused engine and acceptance tests without adding test-only product logic. |
| Real-user effectiveness evidence | Research protocol only | `research/human_study/`, paper | No | Real local-model systems pilot exists, but there are no target-user preference ratings. | Research | Keep claims scoped; prepare blinded UI only after ethics/IRB determination. |

## Verified baseline behavior

The audit ran the implementation rather than relying on documentation:

- Product: 27 tests passed across nine files; TypeScript, ESLint, and production
  Vite/esbuild build passed.
- Research: 29 tests passed.
- Deployment: the public GitHub Pages root returned HTTP 200 and its production
  JavaScript asset returned HTTP 200.
- Existing tests verify exact domain isolation, scope precedence, current-request
  override, weak-signal accumulation, lock protection, bounded compilation,
  import rejection, IndexedDB persistence, and provider fixture selectors.
- The public browser render showed the profile editor and prompt compiler, but no
  applied-versus-suppressed trace, learning transition, or response comparison.

## Implemented, partial, documented-only, and broken

### Implemented

Local IndexedDB storage, bounded typed preferences, exact hierarchical scope,
confidence/decay, explicit and repeated implicit evidence, locks, CRUD, validated
UPP 0.1 import/export, current-request precedence, compact compilation, metadata
logs, four extension experiment conditions, ChatGPT/Claude adapter fixtures, and
the five-condition research harness.

### Partially implemented

Domain classification, learning coverage, conflict evidence, explanation traces,
profile portability, dashboard transparency, public domain demonstration,
provider portability, privacy communication, and extension reliability.

### Documented but not implemented

A separate applicability evaluator, inspectable suppressed candidates, session and
temporary lifetimes, semantic fallback classification, multi-domain output,
provider behavioral conformance UI, in-page applied-preference indicator, semantic
import reconciliation, storage migrations, and corrupted-record recovery.

### Broken or misleading

- `ambiguous` preferences can currently pass retrieval and be compiled.
- The public provider selector implies comparison but only changes a label.
- The public seed profile is predominantly locked, blocking the requested learning
  story.
- “Confidence” is visible without consistently explaining that it measures
  evidence support, not empirical accuracy or response benefit.

### Mocked or placeholder only

- Gemini is an unenabled adapter placeholder.
- The public playground performs no live model inference.
- Human-evaluation screens and outcomes are research plans, not completed product
  capabilities.

## Highest-value implementation sequence

1. Fix ambiguous-state retrieval and introduce inspectable applicability/suppression.
2. Rebuild the public demo around guided Java, finance, abstention, and learning
   scenarios with honest pre-generated responses.
3. Show one canonical profile compiled for ChatGPT, Claude, Gemini, and a local
   model without creating provider-specific preference stores.
4. Improve evidence-confidence, conflict, privacy, and “why/why not” explanations.
5. Add extension status UX and live-provider smoke procedures while keeping Gemini
   disabled until validated.

