# Statistical analysis plan

Status: **prospective plan.** The final version should be preregistered with the
frozen stimuli, model snapshots, code commit, and power simulation before
unmasking human outcomes.

## Analysis populations

- **Intent-to-evaluate (primary):** all randomized judgments with a generated,
  displayable response, analyzed in assigned condition.
- **Per-protocol (sensitivity):** participants who pass consent/comprehension,
  complete the required blocks, and do not meet preregistered quality exclusions.
- **Generation-failure population:** all assigned generations, including errors,
  used to compare failure and retry rates.

Exclude neither participants nor responses based on whether they favor the
hypothesis. Bots/duplicates, impossible completion times, failed instructed
response items, and excessive missingness need numeric thresholds fixed before
label access. Preserve an auditable exclusion table by masked participant ID.

## Primary estimand and model

The primary endpoint is a blinded pairwise choice for E versus A. Ties remain a
third outcome. The preferred analysis is a Bayesian or frequentist ordinal/categorical
mixed model appropriate to the final instrument. A practical frequentist primary
model is a cumulative-link mixed model over ordered outcomes A preferred < tie <
E preferred, with:

`choice ~ condition_order + domain + provider + (1 | participant) + (1 | task)`

If proportional-odds diagnostics fail materially, use a multinomial mixed model
or analyze decisive choices with a binomial mixed model and separately report tie
probability. A simple sign test may be reported as a transparent robustness check,
not as a replacement for the crossed design.

Report the E-versus-A odds ratio, model-based probability difference, 95%
confidence interval, and predicted probabilities. A positive estimate is not
sufficient without its prespecified uncertainty test.

## Secondary rating models

Seven-point ordinal ratings use cumulative-link mixed models:

`rating ~ condition * provider + condition * domain + order + period +`
`         (1 + condition | participant) + (1 | task)`

Simplify random-effects structure only for documented non-convergence, following
a fixed sequence: remove correlation parameters, then smallest variance random
slope, while preserving participant and task intercepts. Linear mixed models on
ratings and participant-level paired means are sensitivity analyses.

Bipolar appropriateness ratings are modeled as absolute distance from the ideal
midpoint for the main interpretation; direction (too little versus too much) is
reported descriptively and with an ordinal model.

## Confirmatory contrasts and multiplicity

- H1 (E vs A on overall preference) is the sole primary test at two-sided
  alpha 0.05.
- H2--H5 and H7--H8 form a secondary family controlled by Holm's procedure.
- H6 quality non-inferiority is tested separately at one-sided alpha 0.025; the
  context-token superiority contrast is interpreted only if non-inferiority is
  established (gatekeeping).
- Per-provider, per-domain, and individual-dimension analyses are reported with
  multiplicity-adjusted intervals or explicitly labeled exploratory.

The H6 non-inferiority margin must be justified from prior measurement work or a
participant-centered smallest effect of interest; it may not be chosen from the
observed data.

## Longitudinal learning and drift

Probe-level adherence is analyzed using a generalized mixed model with condition,
phase/time, and their interaction, crossed participant/persona and task effects.
Adaptation delay is summarized with survival methods where the event is stable
activation of the new preference and non-adaptation is censored. Report false
activation alongside time-to-adaptation.

Confidence calibration is evaluated at the preference-evidence decision level
with Brier score, calibration intercept/slope, reliability plots, and stratified
bootstrap intervals clustered by participant/persona.

## Provider portability

Portability is evaluated by the condition-by-provider interaction and by
provider-specific marginal E-A effects. Evidence for portability requires that
effects are not materially harmful on any preregistered provider and that the
shared-profile implementation is identical above thin API formatting adapters.
A non-significant interaction alone is not proof of invariance.

For a stronger claim, specify an equivalence band for provider effect
heterogeneity before collection and test equivalence. Leave-one-provider-out
analysis assesses dependence on a single family.

## Missing data and generation errors

- Log every assigned generation, timeout, moderation refusal, parse failure, and
  retry. Do not repeatedly sample until a desirable answer appears.
- If ratings are missing conditional on observed design variables, mixed models
  use available outcomes and those variables. Report pattern and rate by condition.
- If missingness exceeds the preregistered threshold or differs by condition,
  perform inverse-probability weighting and delta-adjustment sensitivity analyses.
- No single imputation of outcome ratings is used.

## Robustness and diagnostics

- Inspect proportional-odds assumptions, residuals/influence where applicable,
  overdispersion, singular fits, and convergence.
- Refit with participant-clustered bootstrap intervals and participant-level
  randomization/permutation tests respecting blocks.
- Repeat after excluding provider refusals and, separately, count refusals as the
  worst task outcome when defensible.
- Test position, order, period, and carryover effects. Report condition decoding
  success if participants were asked to guess personalization.
- Compare automatic metrics with human preference using held-out correlations;
  avoid selecting the best-correlated metric and presenting it as confirmatory.

## Inter-rater reliability

Before adjudication, compute raw agreement and Krippendorff's alpha for ordinal
rubric items; use ICC(2,k) only for averages of multiple interchangeable raters.
Confidence intervals use participant/task-clustered bootstrap samples. Low
reliability triggers rubric retraining and a new calibration batch, not quiet
replacement of labels.

## Reporting

Use a CONSORT-like flow diagram for allocations, generation failures, response
exclusions, and completed judgments. Publish de-identified analysis data where
consent and policy permit, frozen prompts/profile representations, code, seed,
model metadata, and raw automatic-judge outputs. Tables must label confirmatory,
secondary, exploratory, and pilot analyses. Null findings and harms are retained.
