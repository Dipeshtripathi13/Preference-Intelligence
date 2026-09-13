# Real local-model pilot results

Status: **measured exploratory pilot**, not confirmatory evidence of subjective benefit.

## Design

2 local model families (llama3.2:1b, qwen3:8b) generated responses for one controlled multidomain persona, 4 tasks, 5 conditions, and 2 stochastic replicate(s) per cell. Cell order was deterministically shuffled with a recorded seed. Temperature was 0.3, maximum output was 260 tokens, and reasoning was disabled for comparable visible-output budgets. This dataset contains 80 real generations. Compiler variant(s): verbose_v1.

The concept-coverage rubric is a post-hoc lexical diagnostic derived from the benchmark's pre-existing reference points. It is not a factuality score. Confidence intervals are exploratory cluster bootstraps over model-task clusters.

## Descriptive results

| Model | Condition | n | Reference coverage | Words | Concise proxy | Input tokens | Output tokens | Latency ms | Length-stop rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| llama3.2:1b | domain_dynamic | 8 | 0.344 | 141.8 | 0.500 | 196.2 | 197.2 | 3572.5 | 0.750 |
| llama3.2:1b | dynamic_global | 8 | 0.260 | 146.6 | 0.375 | 139.8 | 197.0 | 3949.5 | 0.750 |
| llama3.2:1b | history_rag | 8 | 0.292 | 104.5 | 0.500 | 133.8 | 138.1 | 2624.5 | 0.500 |
| llama3.2:1b | no_personalization | 8 | 0.219 | 188.4 | 0.250 | 82.8 | 246.0 | 4314.0 | 0.750 |
| llama3.2:1b | static_global | 8 | 0.312 | 141.2 | 0.500 | 121.8 | 197.0 | 3482.2 | 0.750 |
| qwen3:8b | domain_dynamic | 8 | 0.458 | 141.0 | 0.875 | 197.8 | 198.8 | 12693.4 | 0.500 |
| qwen3:8b | dynamic_global | 8 | 0.521 | 146.1 | 0.750 | 138.2 | 194.8 | 12813.6 | 0.250 |
| qwen3:8b | history_rag | 8 | 0.604 | 74.0 | 1.000 | 130.2 | 100.4 | 6511.5 | 0.000 |
| qwen3:8b | no_personalization | 8 | 0.438 | 164.0 | 0.750 | 79.2 | 222.4 | 14210.8 | 0.500 |
| qwen3:8b | static_global | 8 | 0.542 | 107.4 | 1.000 | 118.2 | 138.8 | 8790.7 | 0.000 |

## Paired domain-conditioned contrasts

Positive differences mean the domain-conditioned condition was higher; for words, tokens, and latency, lower values may be preferable depending on the estimand.

| Comparator | Metric | Pairs | Mean difference | Exploratory 95% interval |
|---|---:|---:|---:|---:|
| history_rag | reference_coverage | 16 | -0.047 | [-0.177, 0.104] |
| history_rag | word_count | 16 | 52.125 | [11.562, 99.125] |
| history_rag | provider_input_tokens | 16 | 65.000 | [62.125, 68.000] |
| history_rag | latency_ms | 16 | 3564.968 | [1161.122, 6258.370] |
| no_personalization | reference_coverage | 16 | 0.073 | [-0.052, 0.188] |
| no_personalization | word_count | 16 | -34.812 | [-75.188, -7.000] |
| no_personalization | provider_input_tokens | 16 | 116.000 | [113.000, 119.000] |
| no_personalization | latency_ms | 16 | -1129.457 | [-2289.504, -126.467] |

## Interpretation boundary

These measurements establish that one serialized domain-conditioned profile can be compiled and used by two heterogeneous local model families, with complete run logging and no transport failures. They do not establish that users prefer the personalized responses. The sample contains only one synthetic persona and four English tasks; model capabilities differ substantially; lexical coverage can miss correct paraphrases and reward keyword inclusion; output truncation may affect all metrics; and the analysis was not preregistered before generation.

The condition-blinded annotation file is ready for human scoring. Until those ratings exist, the main research hypothesis remains open.
