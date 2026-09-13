# Preference update algorithm

Status: **proposed design with implementation-facing pseudocode**.

## Trust boundary

The extractor accepts only a `UserAuthoredSignal` captured from the provider's user composer or an explicit dashboard action. AI responses and arbitrary webpage text are contextual inputs for detecting a correction, never evidence authors. DOM origin, message role, event identifier, and provider adapter are validated before updating.

## Pipeline

```text
validate source and deduplicate event
  -> detect current-only vs durable language
  -> classify domain and task independently
  -> extract bounded candidate preference signals
  -> validate dimension/value and assign authority/strength
  -> resolve scope (never infer cross-domain expertise)
  -> append immutable evidence
  -> recompute candidates and contradiction state
  -> persist atomically
  -> expose explanation; compile only above threshold
```

## Pseudocode

```python
def observe(signal, context):
    if signal.author != "user" or not trusted_capture(signal):
        return Rejected("untrusted_source")
    if seen(signal.event_id):
        return Rejected("duplicate")

    intent = detect_temporality(signal.text)
    candidates = extractor.extract(signal.text)
    domain = classifier.classify(context.user_prompt)

    for candidate in candidates:
        validate_bounded_dimension(candidate)
        scope = explicit_scope(candidate) or domain.scope
        if intent.current_only:
            session_overrides.put(candidate, scope, intent.expiry)
            continue

        evidence = score_user_evidence(candidate, signal, scope)
        store.append_evidence(evidence)
        recompute(candidate.dimension, scope)

    return changed_records()
```

## Conflict handling

- A current request never rewrites a conflicting stored preference by itself.
- Explicit “from now on/always” creates strong durable support.
- An explicit dashboard edit supersedes inferred candidates at that scope.
- A locked value rejects all automatic updates while optionally counting contradictory events for a non-invasive review notice.
- Close competing candidates enter `ambiguous` status and are omitted from compiled context.

## Global and scoped evidence

Unscoped durable wording such as “Always put the answer first” may create global evidence. Corrections made after a Java answer attach to the classified Java/software scope unless the wording explicitly generalizes. Expertise-related dimensions require an explicit or confidently classified domain and never default to global from a task-local correction.

## Explicit/implicit extraction examples

| User signal | Candidate | Scope | Authority |
|---|---|---|---|
| “Always keep answers concise.” | `verbosity=concise` | global | explicit durable |
| “For this one, explain every step.” | session `step_by_step=preferred` | current task | current-only |
| “Don't explain basic Java syntax.” | `technical_depth=advanced` | software/java | explicit correction |
| “Make that shorter.” after a finance answer | `verbosity=concise` | finance | implicit correction |
| Assistant: “You are a Python expert.” | none | none | rejected |

## Idempotency and auditability

Provider adapters attach stable event IDs when possible; otherwise the extension uses a hash of provider, conversation-local message ID, and capture time bucket. Updates are transactional. Every displayed confidence links to aggregate evidence counts, last observation, scope, state, and provenance without requiring raw conversation retention.
