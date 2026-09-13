# Research log

## 2026-09-12 — Novelty narrowed by prior work

- **Question:** Which parts of dynamic, domain-conditioned LLM personalization are already established?
- **Finding:** Dynamic profiles, global/domain profiles, interpretable summaries, latent user representations, active elicitation, and utility-aware selection all have prior art. The literature matrix contains 34 directly relevant works and 47 resolved references.
- **Source:** `literature/literature_review.md`, `literature/related_work_matrix.csv`, `literature/references.bib`.
- **Implication:** Do not claim that dynamic or domain-aware personalization is itself novel. Test the joint typed/scoped/calibrated/governed/cross-provider system.
- **Open question:** Does that joint design outperform strong profile, retrieval, and history baselines without harming task quality?

## 2026-09-12 — Counterevidence retained

- **Question:** Should compact structured profiles be assumed to outperform behavior-log retrieval?
- **Finding:** Reviewed compression work is promising, while LUNAR reports settings where direct behavior-log retrieval is stronger. PrefDisco reports that naive personalization can reduce alignment relative to generic responses.
- **Source:** `literature/literature_review.md`, `literature/research_gap.md`.
- **Implication:** Treat profile compression as a falsifiable non-inferiority/efficiency hypothesis and make inappropriate personalization a safety outcome.
- **Open question:** Which histories, domains, and preference types lose critical information during compression?

## 2026-09-12 — Product positioning changed

- **Question:** Is local, cross-AI preference memory a defensible product wedge?
- **Finding:** Rethread already documents cross-platform local-first structured memory with preferences, confidence, provenance, editing, and recall controls. Unifie and native Claude/ChatGPT controls also overlap materially.
- **Source:** `market/competitor_analysis.md`, `market/feature_matrix.csv`, `market/product_gap_analysis.md`.
- **Implication:** Compete on response-policy semantics, applicability, locks/temporary overrides, evidence governance, and measured behavioral portability—not generic memory portability.
- **Open question:** Will users value fine-grained governance enough to offset setup and correction burden?

## 2026-09-12 — Canonical representation selected

- **Question:** Which representation balances portability, performance, and user control?
- **Finding:** A hierarchical symbolic record is the MVP source of truth; optional embeddings may retrieve candidates later but cannot become authority. Records include bounded dimension/value, scope, confidence, state, evidence, provenance, time, decay, and locks.
- **Source:** `preference_model/preference_representation.md`, `preference_model/preference_schema.json`.
- **Implication:** Prompt compilation and UI explanations remain deterministic and inspectable across providers.
- **Open question:** Can the symbolic schema match latent/profile-summary methods on subjective quality?

## 2026-09-12 — Evidence authority and decay specified

- **Question:** How can the system learn without overreacting or accepting poisoned evidence?
- **Finding:** Only trusted user-authored signals can update records. Durable explicit statements outweigh gradual implicit corrections; ambiguous conflicts are withheld; inferred evidence decays; locked values resist automatic changes.
- **Source:** `preference_model/confidence_model.md`, `preference_model/preference_update_algorithm.md`, `preference_model/preference_decay.md`.
- **Implication:** Confidence represents support for an assertion, not expected response-quality gain. Coefficients require calibration against user confirmations.
- **Open question:** What thresholds, half-lives, and clarification policies minimize net harm in real use?

## 2026-09-13 — Experiment program implemented

- **Question:** Can all five baseline/target conditions be reproduced without provider credentials?
- **Finding:** The runner executes no personalization, static global, history retrieval, dynamic global, and dynamic domain-conditioned conditions using a deterministic mock, with adapters for four real provider families.
- **Source:** `experiments/experimental_design.md`, `src/preference_intelligence_research/`, `tests/`.
- **Implication:** Mechanism pilots, schema checks, and logging can proceed now; cross-model effectiveness still requires API access and human judgments.
- **Open question:** Which exact model snapshots and pricing budget should be frozen for the first external pilot?

## 2026-09-13 — Reproducibility checks passed

- **Question:** Does the implemented harness preserve run integrity?
- **Finding:** Twenty-four tests pass with full JSON Schema validation; Ruff and strict mypy pass; all five mock cells serialize; existing output/manifest paths are rejected instead of silently mixed or overwritten.
- **Source:** Local verification commands documented in `experiments/README.md`; generated mock runs under ignored `runs/`.
- **Implication:** The harness is ready for connectivity pilots. Passing tests are software evidence, not personalization results.
- **Open question:** How should rate-limit retries and provider-side nondeterminism be preregistered for paid runs?

## 2026-09-13 — Publication path assessed

- **Question:** Which venue best matches the eventual contribution?
- **Finding:** ACL-family/TACL best fit an algorithm/benchmark result; IUI/CHI/TiiS fit a user-agency and interface contribution; RecSys fits contextual utility learning. Several 2027 deadlines were closed or not announced at the evidence cutoff.
- **Source:** `publication/venue_analysis.md` (facts checked 2026-09-12).
- **Implication:** Choose the venue after the primary evidence emerges and recheck official dates before submission.
- **Open question:** Will the strongest result be an NLP method, an HCI governance contribution, or a negative/conformance benchmark?

## 2026-09-13 — Real randomized local-model pilot completed

- **Question:** Can one serialized domain-conditioned profile execute across heterogeneous real model families, and how does it compare with no personalization and history retrieval?
- **Finding:** Qwen 3 8B and Llama 3.2 1B completed all 80 assigned five-condition generations across four tasks and two stochastic replicates. Domain-conditioned E versus history retrieval used 65 more input tokens, produced 52.1 more words, and added 3.56 seconds; its post-hoc reference-coverage difference was −0.047 with a wide exploratory interval [−0.177, 0.104].
- **Source:** `data/pilot-*.jsonl`, adjacent manifests, and `data/local-pilot-analysis-20260913/`.
- **Implication:** The verbose structured compiler did not support the proposed context-efficiency advantage. Preserve the negative result and test a compact renderer without replacing the original data.
- **Open question:** Can compact rendering lower total inference cost without weakening adherence or correctness?

## 2026-09-13 — Compact compiler ablation exposed an end-to-end cost trade-off

- **Question:** Does removing structured metadata from the generated instruction make the profile more efficient than short history retrieval?
- **Finding:** Across 48 additional real generations, compact E used 19.0 fewer input tokens than history retrieval, but generated 99.1 more output tokens, 70.8 more words, and added 3.12 seconds. Post-hoc concept coverage differed by +0.005 [−0.141, 0.177]. All cells completed; randomized order and seed are recorded.
- **Source:** `experiments/real_local_model_results.md`, `data/compact-ablation-*.jsonl`, and `data/compact-ablation-analysis-20260914/`.
- **Implication:** Optimize and evaluate total response behavior, not serialized profile size alone. Syntactic portability and input compression are insufficient evidence of behavioral conformance.
- **Open question:** Do target users prefer the longer personalized outputs, and do independent raters find them equally correct and safe?

## 2026-09-13 — Research claim and paper narrowed

- **Question:** What is the strongest defensible academic contribution after the pilot?
- **Finding:** The supportable contribution is a user-owned typed/scoped/calibrated/governed response policy, a distinction between syntactic portability and behavioral conformance, and a reproducible mixed systems result. No human ratings exist.
- **Source:** `paper/main.tex`, `paper/sections/08_results.tex`, and the checked-in raw/analysis artifacts.
- **Implication:** Present the 128-generation cost trade-off honestly; retain improved subjective quality as the primary open hypothesis for an approved preregistered study.
- **Open question:** Whether the resulting contribution best fits an HCI governance venue or an NLP systems/evaluation venue depends on the human and correctness outcomes.
