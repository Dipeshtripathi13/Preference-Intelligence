# Evidence-confidence model

Status: **implemented engineering prior; not empirically calibrated**.

The product deliberately calls this quantity *evidence confidence*. It estimates
support for a bounded preference assertion. It is not the probability that the
preference will improve a response, the probability that a classifier is correct,
or a measure of contextual relevance.

## Evidence hierarchy

The reference updater uses the following authority order:

| Evidence | Product representation | Behavior |
|---|---|---|
| Dashboard edit or lock | `dashboard_edit` | User-authored ground truth; confidence 1.0 in the extension dashboard. |
| Direct durable statement | `direct_statement` | Strongest learned evidence; may activate immediately and a newer statement supersedes an older inferred value. |
| Direct correction | `direct_correction` | One new preference is retained below activation threshold; a correction to an existing value may change it because the user explicitly rejected the current behavior. |
| Repeated consistent correction | `repeated_correction` | Confidence increases and can cross the activation threshold. |
| Interaction pattern | `interaction_pattern` | Weakest supported tier; contradictory evidence produces ambiguity and abstention rather than a large update. |

Assistant messages and webpage content have zero authority. They never enter the
updater. Raw correction text is not retained; the durable record contains an
allowlisted signal label, time, source, scope, strength, and polarity.

## Reference update equations

For extractor strength \(s\in[0,1]\), a new direct statement starts at

\[
c_0=\min(0.90, 0.58+0.32s).
\]

A first direct correction starts cautiously at
\(\min(0.34,0.10+0.25s)\); a general interaction pattern starts at
\(\min(0.28,0.08+0.20s)\). Thus one implicit observation cannot pass the
product's 0.35 evidence gate.

Consistent evidence updates confidence as

\[
c'=\min\left(0.99,c+(1-c)(0.14+0.16s)\right).
\]

The implementation marks a record confirmed only after high support and multiple
observations. These coefficients are transparent engineering priors selected to
make the conservative transition testable; they are not fitted estimates.

## Contradiction policy

- A newer `direct_statement` supersedes an unlocked inferred value and records the
  previous/new values in an update event.
- A `direct_correction` changes an unlocked value with evidence confidence bounded
  to 0.72--0.82.
- Conflicting `interaction_pattern` evidence marks the record `ambiguous`, retains
  the competing value and rationale, and prevents compilation.
- A locked value is never mutated automatically. The engine emits a
  `locked_conflict` event so the disagreement is visible.
- “This preference wasn't relevant here” is an *applicability correction*, not a
  preference-inference correction. It adds negative scoped evidence while keeping
  the underlying preference intact.

This policy intentionally avoids averaging explicit preference changes forever.
Recency, explicitness, locks, and scope all matter.

## Decay and activation

Unlocked, inferred records decay at retrieval time:

\[
c_{eff}=c\exp(-r\Delta_{days}),
\]

where the current product uses `r=0.002` for explicit evidence and `r=0.01` for
implicit evidence. Confirmed and locked records do not decay in the reference
retriever. Unlocked records below 0.35 effective evidence confidence are withheld.

Activation still requires a separate contextual applicability score. A
high-confidence preference can be irrelevant to the current request.

## Calibration protocol

The numerical policy must be calibrated with user confirmations before being
presented as probabilistic. A future study should stratify inferred preferences,
ask users to accept/reject/edit them, and report reliability diagrams, Brier
score, expected calibration error, coverage, correction burden, and net
personalization harm. Coefficients should be fitted on a development cohort and
reported on held-out users. Engagement alone is not authoritative evidence.
