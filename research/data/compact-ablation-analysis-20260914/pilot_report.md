# Real local-model pilot results

Status: **measured exploratory pilot**, not confirmatory evidence of subjective benefit.

## Design

2 local model families (llama3.2:1b, qwen3:8b) generated responses for one controlled multidomain persona, 4 tasks, 3 conditions, and 2 stochastic replicate(s) per cell. Cell order was deterministically shuffled with a recorded seed. Temperature was 0.3, maximum output was 260 tokens, and reasoning was disabled for comparable visible-output budgets. This dataset contains 48 real generations. Compiler variant(s): compact_v2.

The concept-coverage rubric is a post-hoc lexical diagnostic derived from the benchmark's pre-existing reference points. It is not a factuality score. Confidence intervals are exploratory cluster bootstraps over model-task clusters.

## Descriptive results

| Model | Condition | n | Reference coverage | Words | Concise proxy | Input tokens | Output tokens | Latency ms | Length-stop rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| llama3.2:1b | domain_dynamic | 8 | 0.375 | 189.2 | 0.125 | 114.8 | 246.1 | 3776.2 | 0.625 |
| llama3.2:1b | history_rag | 8 | 0.208 | 103.8 | 0.625 | 133.8 | 135.5 | 2136.1 | 0.250 |
| llama3.2:1b | no_personalization | 8 | 0.302 | 181.8 | 0.375 | 82.8 | 241.4 | 4073.3 | 0.750 |
| qwen3:8b | domain_dynamic | 8 | 0.448 | 128.1 | 1.000 | 111.2 | 185.0 | 10114.6 | 0.250 |
| qwen3:8b | history_rag | 8 | 0.604 | 72.0 | 1.000 | 130.2 | 97.5 | 5522.9 | 0.000 |
| qwen3:8b | no_personalization | 8 | 0.562 | 169.0 | 0.750 | 79.2 | 220.8 | 12753.0 | 0.500 |

## Paired domain-conditioned contrasts

Positive differences mean the domain-conditioned condition was higher; for words, tokens, and latency, lower values may be preferable depending on the estimand.

| Comparator | Metric | Pairs | Mean difference | Exploratory 95% interval |
|---|---:|---:|---:|---:|
| history_rag | reference_coverage | 16 | 0.005 | [-0.141, 0.177] |
| history_rag | word_count | 16 | 70.812 | [28.625, 117.312] |
| history_rag | provider_input_tokens | 16 | -19.000 | [-19.750, -18.250] |
| history_rag | latency_ms | 16 | 3115.898 | [1324.797, 5026.277] |
| no_personalization | reference_coverage | 16 | -0.021 | [-0.156, 0.125] |
| no_personalization | word_count | 16 | -16.688 | [-42.750, 6.312] |
| no_personalization | provider_input_tokens | 16 | 32.000 | [31.250, 32.750] |
| no_personalization | latency_ms | 16 | -1467.784 | [-2733.639, -467.483] |

## Interpretation boundary

These measurements establish that one serialized domain-conditioned profile can be compiled and used by two heterogeneous local model families, with complete run logging and no transport failures. They do not establish that users prefer the personalized responses. The sample contains only one synthetic persona and four English tasks; model capabilities differ substantially; lexical coverage can miss correct paraphrases and reward keyword inclusion; output truncation may affect all metrics; and the analysis was not preregistered before generation.

The condition-blinded annotation file is ready for human scoring. Until those ratings exist, the main research hypothesis remains open.
