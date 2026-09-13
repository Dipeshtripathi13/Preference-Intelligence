# Project task map

Status legend: `[x]` implemented and locally verified; `[ ]` requires external access, human review, or a later milestone.

## Research landscape

- [x] Primary-source literature review and related-work matrix
- [x] Product/industry comparison and defensible gap analysis
- [x] Current publication-venue analysis

## Research methodology and infrastructure

- [x] Hypotheses, experimental design, metrics, power and statistical plans
- [x] Multi-domain synthetic benchmark and honest evaluation rubric
- [x] Reproducible provider/condition experiment runner with mock mode
- [x] Human-study protocol and final current paper draft without invented results
- [x] Freeze two local model snapshots and run randomized real-model pilots
- [x] Preserve 128 raw generations, manifests, hashes, analyses, and blinded pairs
- [ ] Complete ethics/IRB determination and recruit real participants

## Preference representation and interoperability

- [x] Versioned, hierarchical, provenance-aware preference schema
- [x] Evidence weighting, conflict handling, decay, scope inheritance, and overrides
- [x] Provider-independent export/import specification
- [ ] Calibrate confidence and decay coefficients with user-confirmed data

## Product MVP

- [x] Local-first Manifest V3 extension for ChatGPT and Claude
- [x] Standalone local web playground with a working browser URL
- [x] Domain/task classification, retrieval/ranking, compact context compilation
- [x] Explicit and implicit preference evidence with poisoning defenses
- [x] Inspect/edit/lock/delete/reset/disable controls and import/export
- [x] Developer experimental mode and automated domain-isolation tests
- [ ] Live-browser smoke tests and selector monitoring for ChatGPT/Claude
- [ ] Enable Gemini only after live validation

## Integration and verification

- [x] Cross-check research and product schemas
- [x] Install, type-check, lint, test, build, and inspect the extension manifest
- [x] Dry-run research experiments and verify machine-readable logs
- [x] Reject run-output collisions and test profile import/export safety
- [x] Conduct an exploratory blinded-ready two-model evaluation and populate scoped results
- [ ] Collect target-user ratings and independent correctness judgments under approved protocol
