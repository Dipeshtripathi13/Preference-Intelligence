# Running the experiments

The proposed four-week test of whether learned preferences add value beyond
paired-answer setup is specified in
[`onboarding_divergence_study.md`](onboarding_divergence_study.md). It is a study
plan only; no participant results are claimed.

The core runner uses only the Python standard library. Python 3.10 or newer is
required. A dry run never calls a network or reads an API key; it writes
deterministic mock responses that are plainly marked as non-evidence.

## From the repository root

Run a two-cell domain-isolation dry run:

```bash
python3 research/run_experiment.py \
  --provider openai \
  --model dry-run-model \
  --dry-run \
  --persona p01_engineer_finance_novice \
  --task finance_duration_01 \
  --condition no_personalization \
  --condition domain_dynamic \
  --output research/runs/domain-isolation.jsonl
```

Run every condition on one held-out current-request override:

```bash
python3 research/run_experiment.py \
  --provider mock \
  --persona p03_executive_science_learner \
  --task general_json_override_01 \
  --condition all \
  --output research/runs/all-conditions.jsonl
```

Randomize generation order and collect repeated stochastic samples with a recorded seed:

```bash
python3 research/run_experiment.py \
  --provider local --model '<exact-local-model-id>' \
  --base-url http://127.0.0.1:11434 \
  --condition all --replicates 2 --shuffle-cells \
  --seed 20260913 --temperature 0.3 \
  --output research/data/local-pilot.jsonl
```

For thinking-capable OpenAI-compatible models, `--reasoning-effort none` prevents
the reasoning trace from consuming a small pilot's entire output budget. The
setting is recorded in both the manifest and each cell. Do not compare models
using different reasoning settings without declaring that difference.

Structured conditions default to the compact behavior-only renderer
`--compiler-variant compact_v2`. Use `--compiler-variant verbose_v1` only to
reproduce the first 2026-09-13 local pilot, whose prompt included scope and
confidence metadata. The selected preference records remain fully available in
JSONL logs under both variants.

## Completed real local-model runs

The repository includes 128 non-mock generations from `qwen3:8b` and
`llama3.2:1b`, with randomized cell order, two replicates, raw JSONL, manifests,
hashes, paired contrasts, and blinded annotation files. See
[`real_local_model_results.md`](real_local_model_results.md) for the measured
results and exact analysis commands. These data establish a systems trade-off;
they do not contain human ratings or prove subjective benefit.

## From `research/`

```bash
python3 run_experiment.py --provider mock --split development --limit 10
PYTHONPATH=src python3 -m preference_intelligence_research.statistics.summary \
  runs/run-YYYYMMDDTHHMMSSZ.jsonl
PYTHONPATH=src python3 -m unittest discover -s tests -v
```

Use the output path printed by the runner in place of the timestamp placeholder.
Every run writes `<name>.jsonl` and `<name>.manifest.json`. The JSONL contains full
condition inputs and outputs; treat real runs as potentially sensitive and follow
the study data plan. `research/runs/` is ignored by git. To prevent mixed runs or
manifest drift, the runner refuses to start if either target file already exists;
choose a new `--output` rather than deleting an auditable run.

## Portable canonical profiles

The benchmark personas are normalized to the canonical `dimension` plus
`scope.domain/subdomain/task` contract. To replace their synthetic preferences
with a Universal Preference Profile:

```bash
python3 research/run_experiment.py \
  --provider mock \
  --profile research/specification/example-profile.json \
  --persona p01_engineer_finance_novice \
  --task se_java_virtual_threads_01 \
  --condition domain_dynamic \
  --output research/runs/profile-import.jsonl
```

Static-profile and history conditions still use the selected benchmark persona;
the imported canonical records drive structured global/domain conditions.

## Real providers

Export credentials in the shell or use a secret manager. The runner intentionally
does not load `.env` automatically. Exact model identifiers are required so run
records do not hide changing defaults.

```bash
export OPENAI_API_KEY='...'
python3 research/run_experiment.py \
  --provider openai --model '<exact-model-id>' \
  --condition domain_dynamic --limit 2 \
  --output research/runs/openai-connectivity.jsonl
```

Equivalent providers are `anthropic` with `ANTHROPIC_API_KEY`, `gemini` with
`GEMINI_API_KEY`, and `local` with an OpenAI-compatible
`LOCAL_MODEL_BASE_URL`. `--base-url` overrides an endpoint. No provider SDK is
required; failures name the missing variable or endpoint and exit nonzero.

Connectivity pilots establish only that the adapter and logging work. The
descriptive summary prints automatic surface checks, latency, and approximate
tokens; it must not be presented as subjective-quality evidence.

## Optional development tooling

The test suite runs with `unittest` and no dependencies. Installing the optional
development extra enables the full canonical JSON Schema check, pytest, linting,
and type checking:

```bash
cd research
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/pytest -q
.venv/bin/ruff check src tests run_experiment.py
.venv/bin/mypy
```

Do not install dependencies into a shared system environment when a project
virtual environment is available.
