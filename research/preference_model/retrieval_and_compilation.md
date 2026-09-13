# Preference retrieval and context compilation

Status: **proposed design**.

## Eligibility

A record is eligible only when it is enabled, unexpired, not suppressed or ambiguous, recognized by the compiler, and matched by the classified scope. Locked state changes authority, not scope. A Java lock is still ineligible for physics.

When domain-classification confidence is below the policy threshold, only transferable global style dimensions are eligible. Domain-sensitive dimensions (`technical_depth`, `explanation_level`, `math_depth`) require a confident scope match.

## Ranking

For eligible record \(p\), compute a testable ranking score:

\[
S(p,q)=w_a A(p)+w_s S_c(p,q)+w_c C(p,t)+w_r R(p,q)-w_k K(p)
\]

where authority \(A\) reflects locked/confirmed/inferred state; scope match \(S_c\) rewards task, subdomain, domain, then global; \(C\) is decayed confidence; semantic relevance \(R\) is optional and can only reorder eligible symbolic records; and conflict penalty \(K\) withholds uncertain competitors. Initial weights are implementation parameters, not learned truth, and are preregistered for evaluation.

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

The compiler returns the rendered text, selected IDs, all override/withhold decisions, classification, estimated tokens, and template version.

## Budgeting

Primary policy begins with a 120-token personalization budget and a maximum of six dimensions. Rank first, then greedily add complete template lines; never truncate a line into a malformed instruction. Deduplicate semantically redundant lines. Experiments vary the cap and compare actual provider token counts, adherence, and latency.

## Explanation trace

For every used or withheld candidate, retain a local structured decision containing:

- preference ID, dimension, value, and scope;
- state and effective confidence;
- selection or override reason;
- matched domain/task and classifier confidence;
- template version and estimated token contribution.

Normal mode does not retain the raw prompt. Experimental raw-prompt logging is separately opt-in.

## Baselines

- **No personalization:** compiler receives no profile.
- **Static global:** only manually authored global records.
- **History retrieval:** separately retrieved user-authored snippets under the same token budget; no assistant text as preference authority.
- **Dynamic global:** learned records with scope removed or global only.
- **Dynamic domain-conditioned:** full eligibility and hierarchy above.

The same compiler and symbolic templates should be used across providers except for the minimal role/message envelope required by each API or UI adapter.
