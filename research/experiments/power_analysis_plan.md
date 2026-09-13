# Power analysis plan

Status: **planning framework, not a completed power claim.** Final sample sizes
depend on pilot-estimated participant, task, and model variance and the selected
smallest effect of interest (SESOI).

## Why simulation is required

Ratings and choices are repeated within participant and crossed with tasks and
providers. Treating every rating as independent would overstate power. The final
calculation will simulate data from the exact allocation and planned mixed model,
including ties, missing generations, participant heterogeneity, task difficulty,
and condition-by-provider variation.

## Inputs to determine before confirmatory collection

1. Primary response model and link function.
2. SESOI for E versus A, elicited in an interpretable scale (for example an
   absolute change in probability of preferring E), then mapped to model scale.
3. Baseline A/E/tie probabilities from a condition-masked feasibility pilot.
4. Participant and task random-effect variances and participant condition-slope
   variance.
5. Expected attrition, invalid-response, refusal, and API-failure rates.
6. Number of providers, task domains, judgments per participant, and block design.
7. Desired power (target at least 0.80; 0.90 considered) and two-sided alpha 0.05
   for H1.

Pilot estimates are uncertain. Simulations therefore span conservative ranges
rather than plugging in a single optimistic value.

## Candidate design grid

Evaluate at minimum:

- participants: 48, 72, 96, 144, 192;
- scored E-versus-A pairs per participant: 8, 12, 16, 24;
- task templates per domain: 4, 8, 12;
- decisive E preference probability under H1: a grid around the chosen SESOI;
- tie rates: 0.10, 0.25, 0.40;
- participant random-slope standard deviation: low, pilot estimate, and 1.5 times
  pilot estimate;
- total unusable allocations: 5%, 10%, 20%.

These are simulation candidates, not recommended sample sizes.

## Simulation algorithm

For each candidate design and parameter scenario:

1. Build the actual balanced allocation of participants, tasks, domains,
   providers, positions, and orders.
2. Draw participant intercepts/slopes and task intercepts from the specified
   distributions.
3. Generate three-category choices from the prespecified model.
4. Apply condition-dependent and condition-independent missingness scenarios.
5. Fit the exact primary analysis, including its convergence/fallback rules.
6. Record rejection of H1 at the correct alpha, interval coverage, bias,
   convergence, and type-I error under the null.
7. Repeat with enough Monte Carlo iterations that the simulation standard error
   of estimated power is acceptably small (for example, roughly 0.005 requires
   about 10,000 runs near 80% power).

Select the smallest feasible design achieving the power target in the primary
scenario and at least 0.80 in prespecified conservative scenarios. Inflate the
number randomized, not the analyzed significance level, for expected attrition.

## Precision and secondary considerations

- Report expected confidence-interval width for the E-A probability difference,
  not power alone.
- H3/domain isolation and provider interactions generally require more clusters
  than the pooled main effect. If these are central confirmatory claims, power
  them explicitly; do not infer adequate interaction power from H1.
- H6 uses non-inferiority power with its independently justified margin and
  within-participant correlation.
- Reliability calibration needs enough double ratings across condition, provider,
  and domain strata; decide this from desired interval width for alpha/kappa.
- Participant burden and fatigue cap trials per person. Prefer more participants
  and task clusters over many near-duplicate ratings from a small sample.

## Blinded internal pilot option

A blinded internal pilot may update nuisance parameters (tie rate, variance,
missingness) without estimating condition effects. Any sample-size re-estimation
rule must be written before the pilot and preserve the type-I error rate. If this
cannot be guaranteed, the pilot remains separate from the confirmatory sample.

## Deliverables before recruitment

- executable simulation script with fixed seed and environment lock;
- plot/table of power, interval width, type-I error, and convergence by scenario;
- chosen design and SESOI justification;
- attrition inflation calculation;
- signed, timestamped preregistration hash.

No post hoc "observed power" will be reported; observed estimates and confidence
intervals are more informative after collection.
