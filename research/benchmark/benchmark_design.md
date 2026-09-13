# Preference Intelligence benchmark design

Version 0.1 is a controlled, synthetic benchmark for validating experimental
plumbing and testing sharply specified preference behaviors. It is not a dataset
of real user preferences and cannot establish subjective benefit.

## Goals

The benchmark evaluates whether a personalization system can:

1. select preferences relevant to the current domain and task;
2. avoid transferring domain expertise into unrelated domains;
3. honor global style preferences unless a scoped or current instruction wins;
4. transfer the same serialized profile across model providers;
5. learn from explicit and repeated implicit feedback without learning from
   assistant-authored assertions;
6. compile less context than raw-history retrieval while retaining preference
   adherence;
7. expose deterministic, inspectable evidence for every selected preference.

## Files and identifiers

- `personas.json` contains six deliberately contrasting, multidomain controlled
  profiles. A profile separates global preferences, domain preferences, and a
  timestamped feedback stream.
- `tasks.json` contains development and locked-test prompts across software
  engineering, machine learning, science, finance, professional writing,
  education, and general knowledge.
- `evaluation_rubric.json` defines human criteria and deterministic diagnostic
  checks. A check is applicable only when referenced by a task.

Stable IDs, not array positions or display names, join the files. All documents
carry a schema version. Changes that alter interpretation require a version bump.

## Persona construction

Personas use behavioral response preferences, not demographic traits. Each has
at least two domains with asymmetric expertise and one explicit task-level or
current-prompt conflict. Profile values are experimental ground truth only for
the synthetic benchmark. They are not claims about actual populations.

Global preferences represent portable style defaults such as concision. Domain
preferences encode expertise and presentation needs only within that domain.
Feedback histories contain:

- explicit durable preference statements;
- repeated implicit corrections;
- ambiguous statements that should not activate after one event;
- invalid assistant- or webpage-authored evidence;
- drift events in selected personas.

## Task construction

Tasks are grouped by template family so paraphrases cannot leak across splits.
Each task defines domain, subdomain, task type, prompt, difficulty, factual
reference points, applicable automatic checks, and human rubric emphasis.
Locked-test prompts must remain unseen during compiler and metric development.

Current-prompt override tasks intentionally conflict with a stored default (for
example, a concise persona explicitly requests a detailed tutorial). Correct
behavior follows the current prompt.

## Benchmark protocols

### Protocol P1: static domain isolation

Run every compatible persona-task pair under A (none), B (static global), and E
(domain-conditioned). Use a compatibility matrix that oversamples expertise
contrasts. Generate at least two stochastic replicates if the provider cannot
honor a seed. Report by provider, persona, task family, and condition.

### Protocol P2: learning trajectory

Replay each feedback history in chronological order into a frozen updater. Probe
after every eligible event without including the probe outcome as new evidence.
Score activation precision/recall, confidence calibration, evidence-to-activation,
and adaptation after drift.

### Protocol P3: history versus structure

Construct a retrieval corpus from user-authored feedback only, plus explicit
irrelevant canaries. Compare equal-token and natural-token C/E contexts. Report
quality/adherence separately from token cost and canary exposure.

### Protocol P4: cross-provider portability

Freeze a profile JSON checksum and compiled condition logic. Run the same
persona-task allocation across all providers. Provider adapters may transform
message envelopes but not profile content. Report provider-specific estimates;
do not infer portability from a pooled average alone.

## Evaluation

Deterministic checks are regression signals: format markers, word bands, expected
or forbidden terms, parseability, and context overhead. Factual reference points
support trained human or separately validated evaluation; naive lexical overlap
is not a factuality score. Target users' blinded judgments remain necessary for
claims about preference and satisfaction.

Task-specific constraints are scored only if applicable. Macro-average across
tasks and report per-dimension results to prevent common easy checks from
dominating. Domain-leakage and current-request override are safety gates.

## Data integrity and expansion

- Validate JSON against documented required fields before a run.
- Record SHA-256 hashes of all benchmark files in the run manifest.
- Never edit locked-test items in response to their observed condition results;
  issue a new version and retain the old one.
- Add independent reviewers for factual reference points before human use.
- Future versions should include participant-contributed tasks, additional
  languages/cultures, accessibility preferences, multi-intent prompts, and more
  adversarial evidence while avoiding sensitive-trait inference.

## Known limitations

The personas are unusually coherent, tasks are English-only, automatic checks
can reward superficial compliance, and domain labels are researcher supplied.
Provider training data may contain similar public questions. Real preferences can
be uncertain, constructed during use, or in tension with correctness and safety.
The benchmark is therefore an engineering and mechanism evaluation layer, not a
replacement for the preregistered human study.
