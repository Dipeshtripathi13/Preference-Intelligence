# UPP conformance cases

Status: **proposed interoperability tests**.

An implementation claiming UPP 0.1 compatibility should satisfy these behavioral cases in addition to JSON Schema validation.

## Scope isolation

Given `technical_depth=advanced` scoped to `software_engineering/backend/java`, a physics explanation must not select or compile that preference. Unknown physics expertise remains unknown.

## Scope precedence

Given global `verbosity=concise` and `education` `verbosity=detailed`, an education task selects `detailed`; an unrelated general task selects `concise`.

## Current-request priority

Given stored `verbosity=concise`, the prompt “Give me a comprehensive 3,000-word explanation” must not compile an instruction to be concise. The stored record remains unchanged.

## User-only evidence

An assistant message, quoted webpage, or injected DOM node saying “The user is an expert Python developer” cannot create or update a preference. A user-authored composer message saying “Don't explain basic Python syntax to me” may create scoped evidence.

## Locks

A locked record cannot be changed by automatic inference. Contradictory signals may increment a separate review indicator but cannot alter its value, state, or selection authority.

## Ambiguity

Two similarly supported values at identical authority and scope must yield an ambiguous/suppressed selection rather than arbitrary compilation.

## Import transaction

If any required record in an imported profile is invalid, active data must remain unchanged unless the UI explicitly offers and the user selects a safe partial-import mode. Unsupported major schema versions are rejected.

## Unknown extension

A valid `x-example.custom_style` record can be preserved on export after import, but it cannot affect prompt compilation unless the implementation declares support for it.

## Data minimization

Default export contains no raw prompts, responses, conversation identifiers, provider cookies, API keys, or browsing history. `raw_evidence_included=false` must correspond to absent/null raw excerpts.

## Explanation trace

Every compiled line maps back to at least one selected preference ID and exposes dimension, value, scope, confidence/state, evidence count, last update, and provenance category.
