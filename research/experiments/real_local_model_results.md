# Real local-model experiments

Status: **completed exploratory experiments with raw model outputs**. These runs
measure execution, token/latency cost, and post-hoc automatic diagnostics. They do
not contain human preference judgments and are not confirmatory evidence that
personalization improves answer quality.

## Design and allocation

One controlled persona (`p01_engineer_finance_novice`) supplied asymmetric domain
preferences: advanced software engineering, beginner finance, and concise global
style. Four tasks covered Java virtual threads, Kafka rebalancing, bond duration,
and portfolio diversification. Two independently served local model families were
used:

- `qwen3:8b`, Qwen 3 8B Q4_K_M
- `llama3.2:1b`, Llama 3.2 1B Q8_0

Both runs used temperature 0.3, 260 visible output tokens, reasoning effort
`none`, two stochastic replicates per model-task-condition cell, and a
deterministically shuffled cell order. The five-condition run used seed 20260913;
the post-hoc compact-compiler ablation used seed 20260914. All 128 assigned real
generations completed; no failed cell was removed or regenerated for quality.

| Dataset | Compiler | Conditions | Real generations | Blinded pairs |
|---|---|---:|---:|---:|
| Five-condition pilot | `verbose_v1` | A, B, C, D, E | 80 | 64 |
| Compact ablation | `compact_v2` | A, C, E | 48 | 32 |

## Main measured result

Pooled paired differences below are domain-conditioned E minus the comparator,
using 16 response pairs and eight model-task clusters per row. Intervals are
exploratory 5,000-draw cluster bootstraps. Reference coverage is a post-hoc
lexical diagnostic derived from benchmark reference points; it is neither a
factuality score nor a user-preference score.

| Compiler | Comparator | Δ reference coverage | Δ input tokens | Δ output tokens | Δ words | Δ latency |
|---|---|---:|---:|---:|---:|---:|
| `verbose_v1` | History retrieval | −0.047 [−0.177, 0.104] | +65.0 [62.1, 68.0] | +78.8 [22.8, 141.9] | +52.1 [11.6, 99.1] | +3.56 s [1.16, 6.26] |
| `verbose_v1` | No personalization | +0.073 [−0.052, 0.188] | +116.0 [113.0, 119.0] | −36.2 [−84.9, −3.6] | −34.8 [−75.2, −7.0] | −1.13 s [−2.29, −0.13] |
| `compact_v2` | History retrieval | +0.005 [−0.141, 0.177] | **−19.0 [−19.8, −18.3]** | +99.1 [42.0, 161.8] | +70.8 [28.6, 117.3] | +3.12 s [1.32, 5.03] |
| `compact_v2` | No personalization | −0.021 [−0.156, 0.125] | +32.0 [31.3, 32.8] | −15.5 [−43.2, 6.2] | −16.7 [−42.8, 6.3] | −1.47 s [−2.73, −0.47] |

The compact policy therefore achieved the narrow input-context objective against
this short history baseline, but it expanded output enough to lose the
end-to-end latency advantage. The concept proxy was too uncertain to support a
quality difference. This mixed result motivates a stronger research objective:
behavioral conformance must jointly measure preference fit, correctness, input
and output cost, truncation, and provider heterogeneity.

## Raw randomized data and integrity

Each raw JSONL row retains the allocation order, replicate, seed, complete prompt,
selected structured records, compiled instruction, response, provider token
counts, finish reason, latency, automatic diagnostics, and error field. The
adjacent manifest records model and run configuration plus benchmark hashes.

| Raw output | Rows | SHA-256 |
|---|---:|---|
| `data/pilot-qwen3-8b-20260913.jsonl` | 40 | `8283ac1b2b947dff6f6abd6c0fc666c2454ae42e4eba8621fa2d75a6b2e2785c` |
| `data/pilot-llama3.2-1b-20260913.jsonl` | 40 | `60e3925cd5efcfe5d89ddb4dfb2e7400060a2c23b04461c1e44927f9893cf6f2` |
| `data/compact-ablation-qwen3-8b-20260914.jsonl` | 24 | `38c209af686e60daf3fa940208f78b4a5989f245a0f8780ca6e274799945726e` |
| `data/compact-ablation-llama3.2-1b-20260914.jsonl` | 24 | `5af6ec1f3d39d29a4ae6feeab4254ce390bee2e333957bacb7a9c774abcb5ec4` |

Generated summaries, paired contrasts, manifests, blinded annotation files, and
separate blinding keys live in:

- `data/local-pilot-analysis-20260913/`
- `data/compact-ablation-analysis-20260914/`

## Reproduce the analysis

From `research/`:

```bash
PYTHONPATH=src python3 -m preference_intelligence_research.analysis.local_pilot \
  --input data/pilot-qwen3-8b-20260913.jsonl \
  --input data/pilot-llama3.2-1b-20260913.jsonl \
  --output-dir data/local-pilot-analysis-20260913 \
  --benchmark-dir benchmark --seed 20260913

PYTHONPATH=src python3 -m preference_intelligence_research.analysis.local_pilot \
  --input data/compact-ablation-qwen3-8b-20260914.jsonl \
  --input data/compact-ablation-llama3.2-1b-20260914.jsonl \
  --output-dir data/compact-ablation-analysis-20260914 \
  --benchmark-dir benchmark --seed 20260914
```

## Evidence boundary

The model families differ substantially in size, several responses reached the
output limit, and the sample contains one synthetic persona, four English tasks,
and two replicates. The compact ablation and lexical analysis were specified after
the first generation run. No IRB/ethics approval or participant recruitment was
claimed. The blinded files are prepared for an approved target-user study; until
then, subjective benefit remains open.
