# Research questions and hypotheses

Status: **preregisterable hypotheses; no results have been collected.**

The primary question is whether a provider-independent, dynamically learned,
domain-conditioned preference representation improves users' subjective
assessment of responses from heterogeneous language models. The estimand is the
average within-participant effect of personalization condition on a response to
the same task, averaged over the preregistered task and model populations.

## Confirmatory hypotheses

| ID | Research question | Directional hypothesis | Primary contrast | Primary outcome |
|---|---|---|---|---|
| H1 | RQ1: personalization | A relevant preference representation improves perceived response quality. | E: domain dynamic > A: none | Overall preference in blinded paired comparison |
| H2 | RQ2: dynamic vs. static | A dynamically inferred profile outperforms a participant-authored static global profile after sufficient feedback evidence. | E > B: static global | Overall preference |
| H3 | RQ3: domain conditioning | Conditioning preferences on domain reduces inappropriate expertise/style transfer. | E > D: dynamic global | Technical-depth appropriateness |
| H4 | RQ4: portability | The E-versus-A benefit is positive across held-out provider families, without provider-specific preference storage. | condition-by-provider interaction plus provider-specific E-A contrasts | Overall preference |
| H5 | RQ5: learning | Later responses better follow stable latent preferences after feedback than before feedback. | post-learning E > pre-learning E | Preference-adherence composite |
| H6 | RQ6: efficiency | A structured profile is non-inferior to history retrieval in subjective quality and uses fewer context tokens. | E vs. C, non-inferiority margin preregistered; E < C tokens | Overall preference; preference-context tokens |
| H7 | RQ7: drift | Recency decay plus explicit corrections adapts faster to a genuine preference change than an otherwise identical no-decay updater. | decay > no decay after change point | Interactions to criterion |
| H8 | RQ8: inference safety | Confidence gating and provenance filtering reduce false preference activation. | full E < unsafe ablation | Incorrect-inference activation rate |

H1 is the single primary confirmatory hypothesis. H2--H8 are confirmatory only
if their outcomes, margins, exclusion rules, and analysis code are preregistered
before data inspection; otherwise they are reported as secondary or exploratory.

## Nulls and falsification criteria

- H1 is not supported if its prespecified condition coefficient is not positive
  after the planned test, or if its adjusted confidence interval contains the
  null. Statistical non-significance is not evidence of equivalence.
- H3 is specifically challenged by a null or harmful effect on cross-domain
  probes such as an expert programmer receiving expert-level finance advice.
- H4 is challenged by material qualitative interaction: a benefit on one model
  family and harm on another. A pooled positive coefficient alone is insufficient.
- H6 requires both parts. Token savings without meeting the quality
  non-inferiority criterion do not support H6.
- H8 is challenged if safeguards merely suppress all personalization; true
  activation and false activation must both be reported.

## Exploratory questions

- Which preference dimensions (verbosity, answer-first structure, examples,
  technical depth, code, math, citations, tone) transfer most reliably?
- Does explicit evidence calibrate faster and more accurately than repeated
  implicit corrections?
- Do effects depend on baseline model instruction-following ability?
- Does showing users the selected preferences improve trust, correction rate,
  or perceived control?
- Are benefits concentrated in style adherence while factual usefulness remains
  unchanged?

## Construct boundaries

"Preference adherence" means compliance with a stated or experimentally
controlled response preference. It is not synonymous with factual correctness,
safety, or overall quality. "Cross-model" means that one serialized profile and
selection algorithm are used without provider-specific stored values; prompts
may still require thin provider adapters. "Dynamic" means the representation is
updated from timestamped evidence under a fixed, auditable algorithm.

Sensitive demographic or protected traits are outside the inference target. A
current, explicit user instruction always overrides a stored preference.
