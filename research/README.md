# Preference Intelligence Research

This workstream asks whether a user-owned, model-independent, dynamically learned, domain-conditioned preference representation can improve subjective response quality across heterogeneous language models.

The repository provides protocols and infrastructure to test that claim; it does not assume the claim is true. Synthetic personas support controlled engineering tests and pilot studies, but do not replace evaluation with consenting human participants.

## Research questions

1. Does preference injection improve perceived response quality over no personalization?
2. Do learned profiles outperform manually written static profiles?
3. Does domain conditioning outperform a single global profile?
4. Does one representation transfer across heterogeneous model families?
5. Can explicit and implicit corrections be learned reliably?
6. Can structured profiles match history retrieval with fewer context tokens and less private-data exposure?
7. How should preferences adapt under drift?
8. How often are preferences inferred incorrectly, and which controls reduce harm?

## Artifact map

- `literature/`, `market/`, `publication/`: evidence and positioning.
- `preference_model/`, `specification/`: the proposed representation and portable interchange format.
- `experiments/`, `benchmark/`: preregistration-oriented methods and controlled tasks.
- `src/`, `tests/`: reproducible experiment runner and verification.
- `human_study/`: study materials requiring institutional review before recruitment where applicable.
- `paper/`: current manuscript draft with the measured exploratory pilot and explicit unmeasured outcomes.
- `data/`: 128 raw real-model outputs, manifests, paired analyses, and blinded annotation files.

## Evidence labels

Artifacts distinguish among **hypothesis**, **proposed design**, **preliminary implementation**, and **measured result**. A passing software test is evidence that code behaves as specified; it is not evidence that personalization improves user outcomes.

## Reproducibility and privacy

Experiments record provider and model identifiers, prompts, conditions, selected preferences, compiled context, timing, token counts when available, seeds, responses, and evaluations. Secrets come from environment variables. Raw human interaction data must not be collected by default, and any human study must complete the appropriate ethics/privacy review before recruitment.

## Quick start

Run the dependency-free suite and a deterministic five-condition dry run:

```bash
cd research
PYTHONPATH=src python3 -m unittest discover -s tests -v
python3 run_experiment.py \
  --provider mock \
  --persona p01_engineer_finance_novice \
  --task finance_duration_01 \
  --condition all
```

Install the optional development tools in an isolated environment for full JSON Schema, lint, and strict type checks:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/pytest -q
.venv/bin/ruff check src tests run_experiment.py
.venv/bin/mypy
```

See `experiments/README.md` for canonical-profile input, provider adapters, exact logging fields, and credential environment variables. The runner refuses to overwrite or append to an existing output/manifest pair.

## Current evidence and verification status

- 29/29 tests pass when the development extra is installed, including analysis and full canonical-profile JSON Schema validation.
- Ruff and strict mypy pass.
- The deterministic mock completes all five experimental conditions and labels its output as non-evidence.
- Two local model families completed 128 real, randomized generations with zero transport failures; raw data and hashes are checked in.
- The compact compiler saved 19 input tokens per prompt versus history retrieval but added about 99 output tokens and 3.12 seconds of latency; the exploratory concept proxy was inconclusive.
- No human preference judgments exist, so subjective effectiveness remains unmeasured.
- The paper builds successfully with Tectonic.
