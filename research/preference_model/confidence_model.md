# Confidence model

Status: **proposed, testable algorithm**. Coefficients are engineering priors and require calibration against user confirmation data.

## Evidence weight

For evidence event \(e\) observed at time \(t_e\), the signed contribution at evaluation time \(t\) is:

\[
w_e(t) = p_e \cdot a_e \cdot s_e \cdot q_e \cdot r_e(t)
\]

where:

- \(p_e \in \{-1,+1\}\) is polarity;
- \(a_e\) is source authority (`dashboard_edit=1.0`, `user_explicit=0.95`, `user_correction=0.80`, `user_implicit=0.25`, non-user source `=0`);
- \(s_e \in [0,1]\) is extractor strength;
- \(q_e \in [0,1]\) is evidence-quality/provenance validity;
- \(r_e(t)\) is recency retention from the decay model.

Repeated identical events are capped per interaction and per day so UI retries or duplicated DOM events do not manufacture certainty.

## Posterior-like update

Maintain positive and negative effective masses with weak prior \(\alpha_0=\beta_0=1\):

\[
\alpha=\alpha_0+\sum\max(w_e,0), \qquad
\beta=\beta_0+\sum\max(-w_e,0)
\]

The support ratio is \(m=\alpha/(\alpha+\beta)\). Evidence sufficiency is \(n=1-\exp(-k\sum |w_e|)\), initially \(k=0.7\). Displayed confidence is:

\[
c = 0.5 + (m-0.5)n
\]

This prevents one weak implicit event from yielding high confidence. A direct user edit or lock uses state-based authority and may set an explicit confidence independent of this inference score.

## Consistency and contradiction

Candidate values for a dimension compete within the same scope. Selection uses effective support, not confidence alone. If the two leading values differ by less than `conflict_margin` (initially 0.15 effective support), neither is automatically compiled. Negative evidence is attached to the rejected value when it clearly contradicts it; otherwise it is recorded as support for the new value.

## Thresholds

Initial policy values, to be calibrated:

- implicit evidence may create a visible candidate at `0.60` confidence after at least two independent interactions;
- compilation requires `0.67` effective confidence and at least two independent implicit events, or one explicit event;
- explicit user statements compile immediately but remain editable;
- locked values compile regardless of inference confidence unless the current prompt overrides them.

Confidence is not the probability that personalization will improve an answer. It estimates support for a particular preference assertion given the captured evidence.

## Calibration protocol

Periodically show a stratified sample of inferred preferences and ask users to accept, reject, or edit them. Evaluate reliability diagrams, Brier score, expected calibration error, and coverage versus acceptance. Fit authority/strength coefficients on a development cohort and report performance on held-out users. Never silently optimize confidence using downstream engagement alone.
