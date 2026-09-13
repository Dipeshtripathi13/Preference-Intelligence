# Research gap and defensible contribution

**Evidence cutoff:** 2026-09-12

## Bottom line

The broad premise—learn a user profile from interaction and use it to personalize an LLM—is already a mature research direction. Dynamic profiles, domain profiles, profile compression, latent preference dimensions, natural-language summaries, active elicitation, evolving memory, and context-aware preference application all have direct prior art. A credible project should not claim novelty for any one of those components.

The open problem is their **joint realization as a user-owned, provider-neutral preference policy** and its rigorous evaluation. The contribution should be stated as a testable systems-and-evaluation claim:

> A typed, uncertainty-aware, hierarchically scoped preference profile with user governance and model-neutral compilation can improve cross-model preference adherence while reducing irrelevant personalization and context cost, relative to full history, generic memory, flat profiles, and uncalibrated retrieval.

This claim is not established by the review; it is the hypothesis the project must test.

## Claims that are not defensible as novelty

- **“The first personalized LLM.”** Persona dialogue predates current LLMs, and LaMP, OPPU, PPlug, PersonalLLM, PLUS, AlignX, and many others directly personalize language models.
- **“The first dynamic user profile.”** Evolving Conditional Memory, PersonaMem, PRIME, PersonalAgent, S2Pref, and other systems update or evaluate evolving profiles.
- **“The first domain-specific profile.”** Su et al. (Findings EMNLP 2025) explicitly generate global and domain profiles and compress domain profiles.
- **“The first interpretable preference summary.”** PLUS (ICLR 2026) learns natural-language user summaries; fine-grained control and Drift expose interpretable attributes.
- **“The first context-dependent preferences.”** S2Pref (Findings ACL 2026), PrefDisco (ICLR 2026), CoPA (Findings ACL 2026), and contextual recommender research directly cover context or domain conditioning.
- **“The first cross-model memory.”** Commercial products and developer memory APIs already advertise use across model providers. Portability alone is a product property, not a new scientific method.
- **“Compressed profiles outperform raw histories.”** This remains empirical. Profile-compression papers report gains, but LUNAR reports settings where direct behavior-log retrieval is stronger.

## Closest prior art by component

| Proposed component | Closest evidence | What remains open |
|---|---|---|
| Dynamic global and domain profiles | Su et al. 2025; PersonalAgent 2026 | Typed scope inheritance, cross-domain leakage control, and provider-neutral behavior |
| Interpretable user representation | PLUS 2026; fine-grained control; Drift | Stable schema semantics, uncertainty, exact provenance, user locks and overrides |
| Multidimensional preference inference | AMPLe 2025; PrefPalette 2025; AlignX 2026 | Combining passive evidence, corrections, abstention, and calibrated confidence in deployment |
| Longitudinal updates | PersonaMem 2025; PRIME 2025; S2Pref 2026 | Explicit authority rules, reversible updates, decay, and auditability |
| Query-conditioned selection | LaMP 2024; PEARL 2024; PURPLE 2026 | Selection explanations, hard context budgets, and safe suppression of irrelevant preferences |
| Over-personalization control | PrefDisco 2026; BenchPreS and RPEval preprints | A unified benchmark across models, domains, and real user corrections |
| Model portability | prompt/RAG methods and commercial memory layers | Semantically equivalent rendering, conformance tests, and measured transfer across providers |
| End-user governance | native memory UIs and several products | Evidence-level provenance, confidence calibration, locks, scoped overrides, and deletion propagation in one policy |

## Specific gaps

### 1. Representation gap: a preference policy, not a prose biography

Most inspectable profiles are free-form summaries; most high-performing learned profiles are latent. Free text is portable but hard to validate, merge, constrain, or explain. Latent vectors are compact but opaque and model-coupled. The missing middle is a bounded schema that records:

- a dimension and value, including explicit negative preferences;
- scope (`global`, domain, subdomain, task, situation);
- confidence and uncertainty source;
- evidence provenance and authority;
- temporal validity, decay behavior, and conflict set;
- user state such as confirmed, locked, rejected, or temporarily overridden.

The schema itself is an engineering artifact. Its research value comes from demonstrating that it improves behavioral portability, calibration, and user control without sacrificing task quality.

### 2. Inference gap: evidence authority and calibrated abstention

Implicit behavior is ambiguous: accepting a response may indicate preference, expedience, or no attention. Current work learns from histories, comparisons, or summaries, but fewer systems expose calibrated belief per preference and a policy for when to ask, apply, or abstain. PrefDisco's finding that naive personalization can underperform generic answers makes this gap consequential.

A useful contribution would evaluate whether evidence-weighted confidence predicts actual preference correctness and whether clarification thresholds improve net utility. Calibration metrics should include Brier score or expected calibration error, alongside correction burden and preference utility.

### 3. Applicability gap: deciding when not to personalize

Semantic relevance is not equivalent to appropriate influence. An item may be related to finance but unsuitable for a regulated calculation; a tone preference may apply while a decision preference should not. S2Pref, BenchPreS, RPEval, and PrefDisco make preference suppression and conflict resolution central. The new layer needs an explicit applicability decision before rendering preferences into a prompt.

Negative controls should contain plausible but irrelevant stored preferences. A successful method should improve relevant preference adherence without reducing factual/task quality on those controls.

### 4. Portability gap: profile portability is not behavioral portability

JSON export or prompt injection proves data portability, not equivalent personalization. Providers interpret instructions differently, impose different precedence rules, and expose different context budgets. The missing evidence is a conformance suite that renders one canonical profile to multiple model families and measures semantic behavior, instruction conflicts, and context cost.

Provider-neutral compilation should preserve the user's current request as highest contextual authority, avoid unsupported system-role assumptions, and report which preference records were selected. The system must test proprietary APIs and open-weight models separately; success on one does not imply success on all future models.

### 5. Governance gap: visibility beyond a memory list

Modern native products increasingly let users view, edit, delete, pause, or import memory. A publishable contribution must go beyond a list editor. Candidate governance primitives are per-record evidence trails, explicit confirmation, locks against passive overwrite, temporary task overrides, conflict explanations, and deletion propagation. Human-subject evaluation should measure predictability and agency, not only preference-match scores.

### 6. Evaluation gap: no single benchmark covers the end-to-end promise

Existing benchmarks isolate retrieval, preference following, long history, style, dynamic personas, cold start, or suppression. The project needs an evaluation matrix crossing:

- explicit, implicit, corrected, conflicting, obsolete, and irrelevant preference evidence;
- global, domain, task, and situational scope;
- short and long histories;
- multiple proprietary and open-weight model families;
- full-history, semantic retrieval, generic memory, flat profile, oracle profile, and no-personalization baselines;
- accuracy, preference utility, over-personalization, calibration, latency, tokens, privacy, and human control.

The benchmark should reuse or adapt public tasks where licensing permits, then add conformance cases for portability and governance. Synthetic users enable scale but should be paired with a preregistered human study because current benchmarks frequently depend on synthetic histories, simulated preferences, or LLM judges.

## Proposed contribution package

A coherent paper can contribute four linked artifacts:

1. **Canonical profile specification:** typed dimensions, hierarchical scope, confidence, provenance, time, conflict, and governance state.
2. **Online update and selection algorithm:** authority-weighted evidence aggregation, calibration, decay, applicability gating, and strict prompt-token budget.
3. **Provider adapters and conformance suite:** deterministic rendering plus behavioral tests across model families.
4. **Longitudinal benchmark and human evaluation:** benefit, negative transfer, corrections, trust, control, and cost.

Any claim of superiority should be limited to the tested models, tasks, languages, and time period. “Works with every AI” is a product aspiration; a research paper can establish evidence across a diverse sample, not universal future compatibility.

## Falsifiers and decision gates

The project should precommit to conditions that would weaken its thesis:

- A generic fact-memory or full-history baseline matches the proposed policy on preference utility and cost.
- The canonical compiler produces large, inconsistent behavior gaps across providers.
- Confidence is not calibrated or does not reduce harmful application.
- Domain hierarchy causes more negative transfer than a flat profile.
- Users cannot understand or effectively correct the typed profile.
- Compression removes useful evidence often enough that direct retrieval wins overall.

If these occur, the valuable result may be a benchmark, interoperability specification, or negative finding rather than a superior personalization method.

## Novelty wording suitable for a paper draft

Use cautious wording until the final search and experiments are complete:

> To our knowledge, prior work has not jointly evaluated a user-governed, typed preference profile with calibrated evidence, hierarchical applicability, and provider-neutral compilation across heterogeneous language models. We study whether this design improves relevant preference adherence while reducing over-personalization and context cost.

Avoid “first” in the abstract unless a reproducible systematic search immediately before submission supports it.
