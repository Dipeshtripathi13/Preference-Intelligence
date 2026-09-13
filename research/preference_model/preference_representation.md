# Preference representation

Status: **proposed design and preliminary implementation contract**, not a measured result.

## Requirements

The representation must be provider-independent, inspectable, sparse, scope-aware, compact enough for prompt compilation, and safe to update incrementally. It represents response preferences—not an unrestricted biography or transcript store. It must preserve uncertainty and evidence origin rather than converting every observation into a fact.

## Alternatives considered

| Representation | Strengths | Weaknesses | Role here |
|---|---|---|---|
| Natural-language profile | Expressive; immediately promptable | Hard to validate, diff, rank, calibrate, or edit safely | Generated output only |
| Flat key/value profile | Simple and transparent | Cannot express scope, evidence, hierarchy, or conflict | Insufficient alone |
| Hierarchical symbolic model | Inspectable scopes and deterministic precedence | Taxonomy maintenance; misses semantic similarity | Canonical source of truth |
| User embedding | Compact and potentially predictive | Opaque, difficult to edit/export/explain; model coupling risk | Optional retrieval feature, never authority |
| Preference graph | Rich relations and exceptions | Complex storage, UI, and inference for an MVP | Possible future extension |
| Symbolic + embedding hybrid | Transparent facts plus semantic recall | Requires careful separation of retrieval from authority | Long-term direction |

The MVP therefore uses a hierarchical symbolic profile. Optional embeddings may later retrieve candidates, but a selected preference must resolve to a human-readable symbolic record before it can affect a prompt.

## Record model

Each preference is one assertion about one bounded response dimension:

```text
(dimension, value, scope, confidence, state, evidence, provenance, time)
```

Scope is a path of `domain -> subdomain -> task`. A missing domain means global. Specificity is explicit: `software_engineering/backend/explanation` can override `software_engineering/*/*`, which can override global. Expertise and technical depth never transfer between sibling domains merely because a user is advanced elsewhere.

The initial bounded dimensions are:

- `verbosity`
- `technical_depth`
- `explanation_level`
- `code_preference`
- `example_preference`
- `analogy_preference`
- `format_preference`
- `step_by_step_preference`
- `tone`
- `math_depth`
- `citation_preference`
- `answer_first_preference`

The schema permits namespaced extensions, but the compiler must ignore dimensions it cannot safely render.

## Evidence and provenance

Evidence records polarity, strength, explicitness, author, capture mechanism, scope at observation time, and timestamp. Only user-authored evidence is eligible for automatic updates. Assistant text, retrieved documents, DOM content outside the user's composer, and imported webpages are untrusted. They may be retained only as rejected audit events in an opt-in experimental log, never as profile authority.

Raw excerpts are optional and off by default. Compact labels such as `requested_shorter_after_response` preserve less sensitive evidence. Provenance identifies the local component or explicit import that created a record.

## State and control

- `inferred`: eligible for evidence updates and decay.
- `confirmed`: explicitly accepted by the user; slow or no automatic decay.
- `locked`: user-controlled and immutable to inference until unlocked.
- `suppressed`: retained for audit/export but not selected.

User edits are new high-authority evidence rather than silent history rewrites. Delete removes the preference and its evidence from active storage. An optional tombstone containing only the identifier and deletion time may prevent sync resurrection; local-only MVP deletion can remove it completely.

## Selection order

The current prompt is authoritative. The proposed deterministic precedence is:

1. explicit instructions in the current user request;
2. explicit session-only override;
3. locked preference at the most specific matching scope;
4. confirmed preference at the most specific matching scope;
5. inferred preference by scope specificity, effective confidence, relevance, and recency;
6. global fallback.

Conflicting values at the same authority and scope are withheld when the winning margin is below a configured ambiguity threshold. The UI reports the conflict instead of compiling arbitrary guidance.

## Temporary preferences

Words such as “for this answer,” “today,” or “in this conversation” create an override with an expiry boundary; they do not mutate durable preferences. “Always” and a direct dashboard edit are durable explicit signals. Ambiguous single requests affect only the current response until repeated evidence establishes stability.

## Prompt compilation

The compiler renders only the highest-value, non-conflicting records within a token budget. It uses behavioral instructions (`Use code before explanation`) rather than psychological claims (`The user is a visual learner`). It includes a fixed guardrail that current instructions override the profile. Selected record IDs are returned for the explanation UI and experimental log.

## Non-goals

The schema does not infer demographics, health status, politics, protected traits, or psychological diagnoses. It is not a factual memory store, identity system, advertising profile, or substitute for provider safety policies.
