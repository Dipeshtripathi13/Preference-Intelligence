# Data flow

## Personalizing a prompt

1. A real user input event updates a composer-only trusted snapshot.
2. A trusted click or Enter submission is intercepted once.
3. The adapter reads the current composer. Equality with the trusted snapshot determines learning eligibility.
4. The service worker classifies the original prompt.
5. If learning is enabled and the action is trusted, the extractor emits bounded user-authored evidence and the updater stores it.
6. The retriever fetches only enabled records matching the current scope and experiment condition.
7. The ranker selects a bounded set; the compiler suppresses dimensions explicitly overridden in the current request.
8. A metadata decision log is stored locally for explanation.
9. The content script writes `compiled preferences → authoritative current request` and activates the provider's submit control.
10. The chosen provider receives the composed prompt. Preference Intelligence does not observe the response.

On any internal error, the content script restores the original prompt and attempts a normal provider submission. A processing guard ignores synthetic submit clicks created by the adapter.

## Learning from correction

```text
trusted composer text
  → conservative signal rule
  → {dimension, bounded value, classified scope, strength, signal label}
  → lock check
  → confidence/conflict update
  → IndexedDB record
```

Assistant text, rendered page text, network responses, and DOM elements outside the composer have no extraction path. A brief correction such as “make it shorter” may use the preceding in-tab classification hint; ordinary general prompts do not inherit the hint.

## Dashboard operations

- Edit/add: validates dimension and value, writes high-authority user evidence, confidence 1, confirmed or locked state.
- Lock: automatic evidence can no longer modify the record.
- Disable: retains a suppressed active record for later re-enable but excludes it from retrieval.
- Delete: removes the record and its compact provenance.
- Disable domain: prevents every record from compiling in that top-level domain.
- Reset: clears preferences and usage logs after an explicit confirmation.

## Import/export

Export maps internal camelCase fields into the canonical `0.1.0` snake_case schema. It exports compact user evidence labels, never raw excerpts. Import parses and validates the full document first, rejects unknown dimensions or values, then writes. Merge skips existing locked records with the same ID. Replace is exposed only as an explicit operation at the message layer; the current dashboard uses merge.

## Experimental mode

The default condition is domain-conditioned personalization. Developer mode can select:

- `no_personalization`
- `static_profile` (dashboard edits and imported records)
- `global_learned`
- `domain_conditioned`

Condition, selected records, context classification, timestamp, provider, and estimated token overhead are logged locally. Prompt text and compiled context are added only when the separate raw-prompt toggle is enabled.
