# Outcome and diagnostic metrics

Status: **metric definitions; no measured values are reported.** Primary and
secondary outcomes must be frozen before confirmatory data are unblinded.

## Human-centered outcomes

| Metric | Instrument / calculation | Scale | Role |
|---|---|---|---|
| Overall pairwise preference | Choice between blinded responses: left, tie, right | categorical | Primary |
| Overall quality | "This answer is a good response for me for this task" | 1--7 | Secondary |
| Usefulness | Supports the user's next action or understanding | 1--7 | Secondary |
| Technical-depth appropriateness | Too basic/too advanced balance, recoded as distance from "about right" | 5-point bipolar | Secondary |
| Amount-of-detail appropriateness | Much too short to much too long; absolute distance from midpoint | 5-point bipolar | Secondary |
| Clarity | Easy for this participant to understand | 1--7 | Secondary |
| Preference adherence | Follows preferences relevant to this task without applying irrelevant ones | 1--7 | Secondary |
| Perceived understanding | "The assistant understood how I wanted the answer presented" | 1--7 | Secondary |
| Satisfaction | Overall interaction satisfaction | 1--7 | Secondary |
| Trust/control | Post-block transparency and correction items | 1--7 | Exploratory |

Never collapse these into one score after inspecting treatment effects. If a
composite is desired, its items and standardization are preregistered and its
internal consistency is reported.

## Behavioral and rubric outcomes

- **Explicit constraint adherence:** number of satisfied applicable constraints
  divided by applicable constraints. Each constraint has a task-specific binary
  or ordinal scoring rule.
- **Domain leakage rate:** proportion of responses exhibiting a preference marked
  as invalid for the current domain (for example, advanced finance assumptions
  inherited solely from programming expertise).
- **Current-request override success:** proportion of profile conflicts where the
  current prompt is followed.
- **Incorrect preference activation:** activated preferences unsupported by the
  controlled ground truth or participant confirmation divided by all activated
  preferences; also report false activations per response.
- **Preference recall:** supported relevant preferences activated divided by all
  supported relevant preferences. Precision and recall are reported together to
  expose over-suppression.
- **Adaptation delay:** number of eligible evidence events after a true change
  point until the new preference is active for two consecutive probes.
- **Correction burden:** corrections per task and interactions until the user
  judges the behavior acceptable.

## Objective system metrics

### Length and format

- Whitespace-token and character counts.
- Length deviation: `abs(observed - target) / max(target, 1)` when a numeric
  target exists; interval distance for target bands.
- Requested-format adherence: task-specific checks for bullets, headings,
  code-first ordering, JSON parseability, or prohibited elements.
- Citation presence checks only whether citations were requested and supplied;
  citation correctness requires separate source verification.

### Efficiency

- Preference-context tokens and total input/output tokens, using provider usage
  fields where available and an explicitly labeled approximation otherwise.
- Personalization overhead = personalized input tokens minus matched condition A
  input tokens.
- End-to-end and provider latency in milliseconds, plus retry counts.
- Estimated monetary cost calculated only from a versioned, dated price table;
  absent a verified price table, report tokens rather than cost.

### Consistency and portability

- Per-provider condition effect with confidence interval.
- Heterogeneity of the E-A effect across providers (interaction terms and, where
  justified, random-slope variance).
- Cross-model constraint-adherence dispersion for the same persona-task-condition.
  Low dispersion is not inherently better if all models fail.

### Quality and safety safeguards

- Task correctness scored against task-specific reference points by trained
  raters or validated checks.
- Unsupported-claim and harmful-advice flags, kept separate from style adherence.
- Privacy canary exposure: exact or fuzzy occurrence of planted irrelevant secret
  strings. Real private data must not be planted.
- Instruction/provenance violation: update accepted from assistant-authored or
  webpage-authored content without an authorized user signal.

## Automatic evaluation in the runner

The runnable tooling provides low-cost **diagnostics**:

- approximate word count;
- presence of expected or forbidden lexical markers;
- bullet, heading, code-block, JSON, and answer-first heuristics where a task
  supplies those criteria;
- approximate preference-context token count;
- latency and provider token usage.

These checks are deterministic and useful for regression testing. They are not
presented as measures of subjective preference, semantic correctness, or
personalization quality. An automatic score is `null` when its rubric is not
applicable rather than being silently treated as success.

## Reliability and calibration

- For two independent categorical annotators, report Cohen's kappa; for more than
  two or missing ratings, use Krippendorff's alpha with the matching measurement
  level.
- For continuous/ordinal aggregate ratings, report a two-way random-effects,
  absolute-agreement ICC with its exact specification.
- Report raw agreement alongside chance-corrected measures.
- Confidence calibration uses reliability diagrams, Brier score, and expected
  calibration error against participant-confirmed preference validity.
- Before adjudication, double-annotate a stratified subset. Adjudicated labels are
  used for benchmark labels; pre-adjudication labels are retained for reliability.

## Reporting rules

Report denominators, missingness, distribution summaries, confidence intervals,
and effect sizes, not only p-values. Show per-domain and per-provider estimates
even when the pooled estimate is primary. Distinguish predeclared human outcomes,
automatic proxies, and post hoc analyses in every table and figure.
