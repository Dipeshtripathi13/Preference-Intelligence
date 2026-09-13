# Preference decay and drift

Status: **proposed design**.

## Retention

Inferred evidence decays by half-life:

\[
r_e(t)=2^{-(t-t_e)/h_d}
\]

where \(h_d\) depends on dimension and signal type. Initial hypotheses are 30 days for presentation preferences likely to drift (`verbosity`, `format_preference`), 90 days for interaction strategy (`answer_first_preference`, examples), and 180 days for scoped expertise/depth. These values are not empirically validated.

Explicit durable statements decay slowly; confirmed and locked preferences do not automatically decay. A user may set an expiry or reset any scope.

## Drift detection

The updater compares recent and historical signed evidence windows. Drift is suspected when recent evidence consistently favors another value with minimum independent support and a large margin. The system then lowers selection confidence, exposes “preference may have changed,” and asks for confirmation when practical. It must not flip a locked value.

Temporary language creates expiring session evidence, not drift. A one-off current request is executed but does not weaken the durable profile.

## Forgetting semantics

Decay affects whether an inferred record is selected; it does not necessarily erase the record. Separate retention policy can compact expired evidence into aggregate counts or delete it. A user deletion removes active data immediately. Imported profiles preserve their declared timestamps but are revalidated before use.

## Evaluation

Simulated drift sequences should measure detection delay, false switches, stale-preference compilation rate, and recovery after reversal. Real-user studies should additionally measure whether confirmation prompts are understandable and annoying.
