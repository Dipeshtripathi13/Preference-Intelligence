# Onboarding-to-learned-profile divergence study

Status: proposed longitudinal study; no participants have been enrolled and no
results are claimed.

## Research question

After four weeks of normal use, does a user's earned response-style profile
meaningfully diverge from the choices they made during paired-answer onboarding?

This tests whether dynamic learning adds value beyond a transparent static
custom-instruction profile. If profiles rarely change, the learning mechanism
may not justify its complexity.

## Design

- Prospective, four-week, within-participant longitudinal study.
- Global-first v1 only; contextual classification is excluded.
- Participants explicitly export a profile immediately after onboarding and at
  the end of weeks 1, 2, and 4.
- No telemetry or background upload. Study files are submitted through the
  consented research workflow and contain no raw prompts or AI responses.
- Analysis uses bounded preferences, confidence, evidence counts, provenance
  labels, timestamps, and local usage totals.

Any recruitment requires the appropriate ethics/IRB determination, approved
consent language, and a data-management plan.

## Primary endpoint

`earned_divergence_4w` is true when at least one onboarding-sourced dimension:

1. changes value because of trusted user evidence;
2. is deleted or disabled by the user; or
3. is replaced by a locked or dashboard-set value.

The primary estimate is the proportion of retained participants with
`earned_divergence_4w=true`, reported with a two-sided 95% Wilson confidence
interval. This is a behavioral description, not proof that the final profile is
better.

## Secondary endpoints

- Number of onboarding dimensions that changed per participant.
- New dimensions learned after onboarding.
- Time to first earned update.
- Fraction of setup records that remain unchanged.
- Correction count before each learned activation.
- Frequency of direct overrides, locks, disables, deletes, and ambiguous states.
- Difference between setup confidence and final effective confidence.
- Weekly active use, defined before data inspection using bounded local usage
  events rather than provider conversation text.
- Participant-rated correctness, usefulness, predictability, and perceived
  control for each sampled profile change.

## Pre-registered product decision rule

Before recruitment, choose and freeze a minimum practically meaningful
divergence rate. A reasonable pilot rule is:

> Continue investing in automatic learning only if at least 25% of retained
> participants show earned divergence by week 4 and at least 80% of sampled
> updates are rated correct by their owners.

The thresholds are product criteria, not population-effect claims. A confirmatory
study would require a separate power analysis based on pilot variance and
attrition.

## Comparators

The strongest later experiment randomizes consenting users between:

1. onboarding profile with learning disabled;
2. onboarding profile with global learning enabled.

Primary subjective outcomes should be blinded paired answer preference and
perceived control. Retention is secondary because provider-adapter failures and
extension friction can affect it independently of preference quality.

## Required export additions

The existing profile already contains the required preference provenance. The
study runner should add a separate participant-created manifest containing:

- pseudonymous participant ID;
- export time point;
- extension version;
- browser version;
- consented study condition;
- hash of the exported profile file.

Do not add raw prompts, response text, URLs, conversation IDs, account IDs, or
demographic attributes to the profile schema.

## Analysis cautions

- Onboarding divergence is not automatically improvement; user ratings are
  required to interpret it.
- Participants who never use the extension cannot generate learned divergence;
  report attrition and exposure separately.
- Corrections may reflect one bad model answer rather than a stable preference;
  retain the repeated-correction threshold.
- Provider and model are time-varying confounders. Record only the bounded
  provider label when consent permits.
- Report null and negative findings. A stable onboarding profile is evidence
  that the simpler static product may be sufficient.
