# Data flow

## Personalizing a prompt

1. A real user input event updates a composer-only trusted snapshot.
2. A trusted click or Enter submission is intercepted once.
3. The adapter reads the current composer. Equality with the trusted snapshot determines learning eligibility.
4. The service worker uses the global v1 policy; no domain classifier participates.
5. If learning is enabled and the action is trusted, the extractor emits bounded global user-authored evidence and the updater stores it.
6. The retriever evaluates every global record for enablement, expiry, conflict, and evidence threshold.
7. The ranker selects at most eight dimensions; the compiler suppresses dimensions explicitly overridden in the current request.
8. Applied and suppressed metadata decisions plus any update events are stored locally for explanation.
9. The content script writes `compiled preferences → authoritative current request` into the composer and stops.
10. The user can edit the visible block, submit it again, or press Escape to remove it.
11. Only the second deliberate submit reaches the provider. Preference Intelligence does not observe the response.

On any internal error, the content script restores the original prompt and attempts a normal provider submission. A processing guard ignores synthetic submit clicks created by the adapter.

## Learning from correction

```text
trusted composer text
  → conservative signal rule
  → {dimension, bounded value, global scope, strength, signal label}
  → lock check
  → confidence/conflict update
  → IndexedDB record
```

Assistant text, rendered page text, network responses, and DOM elements outside the composer have no extraction path. All v1 evidence is global. Context hints are used only inside an explicitly enabled contextual research condition.

## Dashboard operations

- Edit/add: validates dimension and value, writes high-authority user evidence, confidence 1, confirmed or locked state.
- Lock: automatic evidence can no longer modify the record.
- Disable: retains a suppressed active record for later re-enable but excludes it from retrieval.
- Delete: removes the record and its compact provenance.
- Reset: clears preferences and usage logs after an explicit confirmation.

## Import/export

Export maps internal camelCase fields into the canonical `0.1.0` snake_case schema. It exports compact user evidence labels, never raw excerpts. Import parses and validates the full document first, rejects unknown dimensions or values, then writes. Merge skips existing locked records with the same ID. Replace is exposed only as an explicit operation at the message layer; the current dashboard uses merge.

## Experimental mode

The default product condition is `global_learned`. Developer mode can select research conditions:

- `no_personalization`
- `static_profile` (dashboard edits and imported records)
- `global_learned`
- `domain_conditioned`

Condition, applied and suppressed records, applicability components, update events,
context classification, timestamp, provider, and estimated token overhead are
logged locally. Prompt text and compiled context are added only when the separate
raw-prompt toggle is enabled.
