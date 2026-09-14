# Preference retrieval and context compilation

Status: **reference mechanism implemented; coefficients remain uncalibrated**.

## Eligibility

A record is eligible only when it is enabled, unexpired, not suppressed or ambiguous, recognized by the compiler, and matched by the classified scope. Locked state changes authority, not scope. A Java lock is still ineligible for physics.

When domain-classification confidence is below the policy threshold, only transferable global style dimensions are eligible. Domain-sensitive dimensions (`technical_depth`, `explanation_level`, `math_depth`) require a confident scope match.

## Applicability gate

The implementation keeps assertion support and contextual relevance separate.
For an otherwise eligible preference \(p\) and request \(q\):

\[
A(p,q)=0.45S_c(p,q)+0.25R(p,q)+0.30C(p,t).
\]

Here \(S_c\) is 1.00 for task, 0.98 for subdomain, 0.90 for domain, 0.75 for
global, and 0 for a mismatch; \(R\) is a deterministic dimension/task relevance
prior; and \(C\) is effective evidence confidence. Mismatched scope is always
ineligible. Otherwise the initial threshold is 0.72. These are inspectable
engineering priors, not learned or validated probabilities.

Applicability corrections are also scoped. Marking a concise preference wrong for
an educational explanation withholds it in comparable contexts without deleting
the user's global concise preference.

## Ranking

For eligible record \(p\), the reference product computes:

\[
S(p,q)=100L(p)+A(p)+10\,\mathrm{Applicability}(p,q),
\]

where \(L\) is the number of populated domain/subdomain/task scope levels and
authority \(A\) is 40 for locked, 20 for confirmed, and 0 for inferred records.
Scope specificity therefore dominates within an eligible dimension, followed by
user authority and applicability. Ranking cannot make an inapplicable record
eligible. Ambiguous conflicts are withheld before ranking rather than represented
as a soft penalty.

Select at most one value per dimension. A more specific matching record outranks a global record even when the global record has modestly higher confidence, unless the scoped record fails the minimum eligibility threshold.

## Current-request conflict filter

Before rendering, extract explicit current-turn constraints such as requested length, format, tone, audience level, language, code/no-code, citations, and step count. If a stored preference conflicts, record an `overridden_by_current_prompt` decision and omit it. The filter should prefer false negatives (not applying a preference) over fighting an explicit request.

The system should not attempt to encode every possible current instruction as a profile value. The original current prompt remains after the preference block and the compiler always includes a request-priority guardrail.

## Rendering

Each recognized `(dimension, value)` maps to a fixed, reviewed behavioral template. Profile values are data, never concatenated into arbitrary system instructions. For example:

```text
Relevant response preferences for this task:
- Use advanced technical depth; skip basic programming concepts.
- Lead with the implementation when useful.
- Keep the response concise to medium length.
Current instructions override these defaults. Do not weaken safety or factuality.
```

The compiler returns the rendered text, selected records, all override/withhold
decisions, classification, update events, and estimated tokens.

## Budgeting

The product injects at most eight dimensions. Rank first, then add only complete
allowlisted template lines; never truncate a line into a malformed instruction.
Every eligible record excluded by this cap receives a `suppressed_budget` trace.
The compiler estimates tokens for UI inspection, while experiments record actual
provider token counts where available. The real local-model pilot shows that
shorter input context does not necessarily reduce output tokens or latency.

## Explanation trace

For every used or withheld candidate, retain a local structured decision containing:

- preference ID, dimension, value, and scope;
- state and effective confidence;
- selection or override reason;
- matched domain/task and classifier confidence;
- final applicability components and estimated compiled tokens.

Normal mode does not retain the raw prompt. Experimental raw-prompt logging is separately opt-in.

## Baselines

- **No personalization:** compiler receives no profile.
- **Static global:** only manually authored global records.
- **History retrieval:** separately retrieved user-authored snippets under the same token budget; no assistant text as preference authority.
- **Dynamic global:** learned records with scope removed or global only.
- **Dynamic domain-conditioned:** full eligibility and hierarchy above.

The same compiler and symbolic templates should be used across providers except for the minimal role/message envelope required by each API or UI adapter.
