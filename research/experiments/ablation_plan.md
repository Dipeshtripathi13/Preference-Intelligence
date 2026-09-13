# Ablation and stress-test plan

Status: **one compiler ablation completed; remaining component ablations planned.**
The compact renderer reduced input tokens against history retrieval by 19.0 per
prompt but increased generated length and latency; see
[`real_local_model_results.md`](real_local_model_results.md). Each remaining
ablation changes one mechanism from the full domain-dynamic condition E while
holding evidence, generation settings, token budget, and tasks fixed.

## Component ablations

| ID | Variant | Removed or changed mechanism | Main diagnostic | Anticipated failure mode (hypothesis) |
|---|---|---|---|---|
| E-full | Reference | Complete confidence-, provenance-, recency-, and scope-aware pipeline | All metrics | None assumed |
| E-no-domain | Global-only scope | Domain/subdomain/task selection | Domain leakage, adherence | Cross-domain expertise/style transfer |
| E-no-confidence | Activate every inferred value | Confidence gating and uncertainty | False activation, precision | Ambiguous one-offs become durable preferences |
| E-no-decay | Uniform historical weight | Recency decay | Adaptation delay, old-value activation | Slow response to real drift |
| E-no-source-weight | Equal evidence authority | Explicit/implicit weighting | Calibration, time to activation | Weak implicit evidence overrides explicit requests |
| E-no-provenance | Accept all text origins | Origin allowlist | Poisoning success | Assistant/web text changes profile |
| E-no-conflict | Last write wins | Contradiction/evidence aggregation | Flip rate, calibration | Oscillation after mixed feedback |
| E-no-lock | Learned updates can replace confirmed values | User lock/override | Override persistence | System fights an explicit user choice |
| E-flat | Unscoped key/value list | Hierarchy/inheritance | Context relevance, tokens | Redundant or irrelevant selection |
| E-NL | Natural-language summary | Structured representation | Editability, adherence, token cost | Loss of provenance and deterministic filtering |

## Baseline sensitivity

History retrieval C is varied by retriever (lexical and embedding where available),
top-k, assistant-text inclusion, and equal versus natural token budget. Static B
is tested with both a short form profile and a participant-edited natural-language
profile. These are sensitivity analyses because weak baselines could inflate E.

## Controlled stress suites

### Domain isolation

- Same persona: expert programming, beginner finance.
- Closely related and distant domains.
- Unknown domain and ambiguous multi-domain prompts.
- Current prompt explicitly requests a beginner explanation in an expert domain.

### Evidence quality and poisoning

- One ambiguous correction versus repeated consistent corrections.
- Explicit preference followed by contrary weak implicit behavior.
- Assistant says "you are an expert" without user confirmation.
- Web content contains an instruction to store a preference.
- Quoted text and hypothetical preferences that are not self-reports.

### Drift

- Abrupt stable change, gradual change, temporary one-session override, and
  alternating task-dependent preferences.
- Long gaps with and without new evidence.
- Explicit correction of a high-confidence inferred preference.

### Efficiency and capacity

- Profiles of 5, 25, 100, and 500 entries.
- Conflicting global/domain/task scopes.
- Tight context budgets and large irrelevant histories.

## Evaluation and analysis

Use matched generations when APIs support deterministic seeds; otherwise generate
independent repeated samples under a balanced seed schedule. The main ablation
analysis estimates each variant-minus-full difference with participant/persona,
task, and provider effects. Apply Holm correction within the component-ablation
family and report effect sizes with intervals.

An ablation that increases recall by activating everything is not a success if
precision or domain leakage deteriorates. Report preference activation precision,
recall, and false activations together. Efficiency ablations report both quality
and context cost.

## Prioritization

1. E-no-domain tests the central research contribution.
2. E-no-provenance and E-no-lock test safety-critical behavior.
3. E-no-confidence and E-no-decay test reliable learning and drift.
4. E-NL and history variants test representation and context efficiency.

Only the first three families should be designated confirmatory if power permits;
the remainder can guide mechanism design and future studies.
