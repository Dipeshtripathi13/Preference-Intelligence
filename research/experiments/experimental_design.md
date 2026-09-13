# Experimental design

Status: **protocol plus completed exploratory local-model pilot.** The 128 real
generations and post-hoc analysis are reported in
[`real_local_model_results.md`](real_local_model_results.md). The human study
needed to support claims about subjective quality has not been conducted.

## Scope and design principles

The experiments test a single provider-independent profile across multiple model
families. Generation parameters, task text, and allowable preference evidence
are frozen within a comparison. Conditions change only the personalization
context. Raw histories are not silently shared between providers.

The program has three stages:

1. **Synthetic verification pilot:** controlled personas and tasks validate
   domain isolation, instruction composition, logging, and obvious adherence.
2. **Controlled longitudinal simulation:** fixed feedback streams test learning,
   contradictory evidence, confidence, drift, and poisoning defenses.
3. **Blinded human study:** real participants author or teach preferences and
   compare randomized model responses in a repeated-measures design.

Synthetic personas do not substitute for evidence from real users.

## Conditions

| Code | Condition | Context available at generation time |
|---|---|---|
| A | No personalization | Current task only; a neutral system instruction is held constant. |
| B | Static global profile | Participant-authored global profile, fixed before evaluation. |
| C | History retrieval | Top-k relevant, redacted user-authored interaction snippets. Token budget is logged; assistant text is excluded from preference evidence. |
| D | Dynamic global profile | Learned structured preferences without domain fields. |
| E | Dynamic domain-conditioned profile | Learned global, domain, subdomain, and task preferences selected hierarchically with confidence/provenance. |

The current prompt has highest priority in every condition. All conditions use the
same neutral safety and task system text. Conditions B--E receive equal maximum
personalization token budgets in the primary quality analysis; an additional
natural-budget run measures efficiency.

## Factorial structure

- **Within participant:** condition and domain, with an incomplete balanced block
  to control burden.
- **Crossed generation factors:** task, provider/model, persona/participant, and
  condition.
- **Between-session factor:** when feasible, session/order sequence for learning
  and drift experiments.
- **Held-out transfer:** at least one provider family and 20% of task templates
  are withheld during prompt/metric development.

The minimum provider target is two heterogeneous hosted families plus one local
or open-weight family. Exact model snapshots, API versions, decoding parameters,
dates, and system fingerprints are frozen in the run manifest. If a provider
cannot expose a stable version, the run date and returned model identifier are
recorded and conclusions are qualified.

## Experimental units and randomization

The response is the generation unit; the participant-task comparison is the
human-evaluation unit. A deterministic schedule created from a recorded seed:

- balances condition order within participant using Latin-square or randomized
  blocks;
- randomizes response labels and left/right position independently per judgment;
- prevents identical task-condition responses from being shown twice to the same
  participant;
- balances providers across domains and task difficulty;
- stores the allocation before generation.

Model sampling seed is sent when supported but is not assumed to ensure exact
provider reproducibility. Temperature and all other decoding settings are fixed.
Generation failures are retried under a preregistered policy, never selected by
response quality.

## Pilot 1: domain conditioning and portability

Use multidomain personas with deliberately asymmetric expertise: for example,
advanced software engineering and beginner finance, plus a global concise-style
preference. Ask matched programming and finance explanation tasks under A, B,
and E. Run the same serialized profile on every provider.

Primary validation checks:

- beginner finance tasks do not inherit advanced programming depth;
- advanced programming tasks avoid introductory syntax unless requested;
- explicit task requests override profile defaults;
- the compiled context and selected preference IDs are traceable;
- condition A contains no profile-derived information.

These are engineering gates, not hypothesis tests about people.

## Pilot 2: preference learning

Generate fixed interaction streams that contain explicit signals ("Always put
code first") and repeated implicit signals (several "make it shorter"
corrections), plus ambiguous one-offs and contradictory evidence. Freeze the
evidence stream across updater variants. Compare pre-learning, intermediate, and
post-learning generations. The evaluator never sees condition names or compiled
contexts.

Measure time/evidence to activation, true and false activations, adherence on new
tasks, and confidence calibration. Add adversarial assistant-authored claims and
webpage-like instructions; neither is authorized evidence.

## Pilot 3: structured profile versus history retrieval

For each evaluation prompt, compare C and E using:

- a quality-matched budget regime (same maximum personalization tokens);
- a natural regime (each method's normal context);
- histories containing relevant preference evidence and irrelevant/private
  details that should not enter the response.

Measure subjective quality, adherence, prompt tokens, latency, irrelevant-detail
leakage, and exposure of canary strings. Non-inferiority margins and privacy
canaries must be fixed before outcome inspection.

## Human evaluation

Participants first complete a short preference elicitation and calibration phase
in at least two domains where their expertise differs. After the learning phase,
they perform new tasks. They rate one blinded answer at a time and make selected
pairwise choices. Human raters who are not the target user may additionally score
format adherence and safety, but cannot replace the target user's overall
preference judgment.

Primary endpoint: forced-choice overall preference between E and A, allowing a
"no preference" option that is modeled explicitly. Secondary 7-point ratings
cover usefulness, depth appropriateness, clarity, amount of detail,
personalization, relevance, satisfaction, and perceived understanding.

## Controls

- Canonical task facts or reference points are condition-invariant.
- Personalization prompts cannot request lower factuality or weakened safety.
- Responses are stripped of provider branding before evaluation.
- The primary human study does not show selected-preference explanations until
  after response ratings, preventing transparency UI from unblinding condition.
- Automatic evaluators receive task, rubric, and answer only; no condition label.
- If LLM judges are used, response order is reversed on a stratified subset,
  multiple judge families are used, raw outputs are preserved, and agreement
  with human judgments is reported.

## Data split and leakage controls

Persona/task templates are divided into development, pilot, and locked test
partitions by template family, not merely by paraphrase. Human-study tasks are
not used to tune preference-compilation templates. Researcher access to decoded
conditions is delayed until preprocessing rules and primary models are frozen.

## Reproducibility record

Every JSONL record includes experiment/run IDs, UTC timestamp, git commit when
available, provider, requested and returned model identifier, parameters, prompts,
condition, selected preferences, compiled context, token usage, latency, output,
automatic scores, errors, and seed. The run manifest additionally records package
versions, task/persona hashes, and environment metadata excluding secrets.

## Stop/go gates

1. Schema validation and domain-isolation unit tests pass.
2. A mock dry run produces complete, parseable logs.
3. A small API pilot confirms adapters and cost/latency logging; it cannot be
   reported as an effectiveness result.
4. An ethics/IRB determination and consent materials are approved as required by
   the host institution before recruitment.
5. Analysis code is run on masked or simulated outcomes before labels are opened.

## Threats to validity

- Controlled personas may exaggerate stable, articulable preferences.
- Provider prompt policies and model updates can confound cross-model effects.
- Repeated ratings can cause fatigue and preference construction.
- A response may satisfy style preferences while being less correct or safe.
- History retrieval quality depends on its retriever, making C a family of
  baselines rather than one canonical implementation.
- Visibility of personalization may create expectancy effects; blinded quality
  and later transparency/trust outcomes are therefore measured separately.
