# Preference Intelligence

**Your preferences. Every AI.**

Public playground: **https://dipeshtripathi13.github.io/Preference-Intelligence/**

Preference Intelligence is a local-first, provider-independent layer for learning *how a user wants AI to respond*. It is deliberately not a general conversation-memory product. The launchable v1 uses global preferences; domain-conditioned scope remains a research track for v2.

The repository contains a working Chrome/Chromium extension, a DOM-free engine package, a portable profile specification, and publication-oriented research infrastructure. V1 asks whether a transparent global profile can earn trust and evolve beyond onboarding choices. The research track separately studies whether domain conditioning improves subjective response quality.

For a plain-language walkthrough of the browser data flow, confidence updates,
multi-turn correction example, and the boundary between user feedback and AI
responses, see [`HOW_IT_WORKS.md`](HOW_IT_WORKS.md).

> Status: working local product plus 128 real local-model generations. The exploratory experiment found an input-compression/output-expansion trade-off; no human study has yet established improved subjective response quality.

## Why this is different

- **Portable:** one versioned JSON profile is independent of ChatGPT, Claude, Gemini, or a local model.
- **Global-first:** v1 deliberately avoids silent domain-classifier errors; the schema retains optional scope for a later opt-in v2.
- **Transparent:** every record exposes scope, confidence, evidence count, source, update time, lock state, and a “why used?” decision.
- **User-governed:** users can add, edit, lock, disable, delete, reset, export, and import preferences. The current request always wins.
- **Local-first:** the MVP keeps the profile in extension-owned IndexedDB and does not run a Preference Intelligence server.

The research review found that dynamic profiles, domain profiles, cross-AI memory, and local-first storage all have meaningful prior art. The defensible contribution is narrower: a typed and hierarchically scoped response-policy format, calibrated/provenance-aware learning, explicit applicability and abstention, user governance, and behavioral conformance across providers.

## System loop

```text
User prompt
  -> global preference selection and current-request conflict check
  -> visible, editable bounded instruction
  -> second user confirmation -> chosen AI provider

Trusted user correction
  -> bounded evidence extraction
  -> confidence/conflict update -> local profile
```

Assistant responses and arbitrary webpage content are untrusted and cannot directly update the profile. Raw prompt logging is off by default and available only inside an internal experimental mode.

## What is implemented

### Product

- Manifest V3 extension with ChatGPT and Claude adapters
- Six-screen, fully skippable paired-answer onboarding
- Onboarding declarations at 50% confidence with one-correction replacement
- Visible, editable pre-send injection with one-key removal
- Standalone browser playground over the same preference engine and local store
- Global-first runtime with no domain classifier in the v1 decision path
- Separate DOM-free `@preference-intelligence/engine` package
- Confidence gating, decay, conflicts, locks, and request overrides
- Transparent React dashboard, compact popup, and unobtrusive in-provider applied-preference indicator
- Canonical `0.1.0` profile import/export
- Four extension experiment modes: none, static, global learned, domain-conditioned
- 57 automated product tests plus passing typecheck, lint, and production build

Gemini has a disabled adapter placeholder but is not granted site access. New providers are out of v1 scope until a contributor supplies and validates an adapter. Provider DOM integrations remain inherently brittle.

### Research

- Evidence-backed literature review, 34-work matrix, 47 resolved BibTeX references, and explicit gap analysis
- 15-product/native-system feature audit and current venue analysis
- Preference representation, confidence/update/decay policy, domain hierarchy, and portable JSON Schema
- Six multidomain synthetic personas, 18 controlled tasks, and an evaluation rubric
- Five experimental conditions, hypotheses, metrics, power/statistical/ablation plans
- Reproducible JSONL runner with mock, OpenAI, Anthropic, Gemini, and local-provider adapters
- Human-study materials and a compiled 13-section paper draft with measured exploratory results and explicit evidence boundaries
- 128 real Qwen 3 8B/Llama 3.2 1B generations, raw randomized JSONL, manifests, hashes, paired analysis, and 96 blinded comparison pairs
- 29 passing research tests, including analysis and full schema validation, plus clean Ruff and strict mypy checks

The real pilot establishes execution and cost behavior, not subjective benefit. Its strongest result is mixed: compact structured context saved 19 input tokens versus history retrieval, but produced about 99 additional output tokens and added 3.12 seconds of latency on average.

## Repository map

```text
.
├── README.md
├── TASKS.md
├── research/
│   ├── literature/       # Review, matrix, references, gap
│   ├── market/           # Competitor and feature analysis
│   ├── preference_model/ # Representation and learning policy
│   ├── specification/    # Universal Preference Profile draft
│   ├── benchmark/        # Personas, tasks, rubric
│   ├── experiments/      # Methodology and run instructions
│   ├── human_study/      # Protocol and instruments
│   ├── publication/      # Venue analysis
│   ├── paper/            # LaTeX/PDF draft with real exploratory results
│   ├── data/             # Raw randomized local-model outputs and analyses
│   ├── src/              # Experiment implementation
│   └── tests/
└── product/
    ├── docs/             # Architecture, data flow, threat model, ADRs
    ├── preference-engine/# Publishable DOM-free npm package
    └── extension/        # Browser extension and tests
```

## Run the research harness

The dry-run path requires only Python 3.10+:

```bash
cd research
PYTHONPATH=src python3 -m unittest discover -s tests -v
python3 run_experiment.py \
  --provider mock \
  --persona p01_engineer_finance_novice \
  --task finance_duration_01 \
  --condition all
```

For schema, lint, and type checks, use an isolated environment:

```bash
cd research
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/pytest -q
.venv/bin/ruff check src tests run_experiment.py
.venv/bin/mypy
```

Real provider runs require an exact model ID and the corresponding environment variable; see [`research/experiments/README.md`](research/experiments/README.md). No credentials are hard-coded or loaded from `.env` automatically.

## Build and load the extension

```bash
cd product/extension
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `product/extension/dist`. Start with non-sensitive prompts because ChatGPT and Claude selector behavior still needs live smoke testing.

To use the preference engine as a normal web app, run:

```bash
cd product/extension
npm run dev -- --host 127.0.0.1 --port 4173
```

Then open `http://127.0.0.1:4173/demo.html`. The profile and usage decisions remain in that browser's IndexedDB; the standalone playground makes no AI API calls.

## Real experiment data

See [`research/experiments/real_local_model_results.md`](research/experiments/real_local_model_results.md) for the design, paired effects, raw-file SHA-256 hashes, limitations, and exact analysis commands. The current paper source is [`research/paper/main.tex`](research/paper/main.tex); its compiled PDF is generated as `research/paper/main.pdf`.

## Privacy and research ethics

The extension observes the selected provider's user composer but never reads assistant responses. It stores compact labels rather than raw conversations and has no analytics, cloud sync, API keys, or wildcard site access. See the product [threat model](product/docs/security_privacy.md).

Human-study files are proposals only. Recruiting participants may require institutional ethics/IRB review, an approved consent process, and a data-management plan. The project makes no claim of IRB approval or human preference measurement.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
