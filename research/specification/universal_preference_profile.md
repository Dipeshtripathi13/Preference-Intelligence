# Universal Preference Profile (UPP) 0.1 draft

Status: **experimental interoperability proposal**. It is not an adopted standard.

## Purpose

UPP is a provider-independent, human-readable interchange format for response preferences. It allows a user to export, inspect, edit, and import preferences across compatible tools without exporting full conversation histories.

## Design principles

- **User-owned:** export and import are explicit; records remain understandable without a vendor service.
- **Contextual:** every record has a global, domain, subdomain, and/or task scope.
- **Transparent:** confidence, state, evidence counts, time, and provenance are visible.
- **Data-minimizing:** raw evidence excerpts are optional and should be omitted by default.
- **Safe to ignore:** unknown namespaced dimensions/domains are preserved on round-trip but not applied without a capable renderer.
- **Request-first:** a current explicit request overrides imported or stored preferences.

## Media type and encoding

The proposed media type is `application/vnd.preference-intelligence.profile+json`. Files use UTF-8 JSON and conventionally end in `.preference-profile.json`.

## Document shape

```json
{
  "schema_version": "0.1.0",
  "profile_id": "469bdbfe-3940-4870-a914-ea02aeabf149",
  "created_at": "2026-09-12T20:00:00Z",
  "updated_at": "2026-09-12T20:00:00Z",
  "generator": {
    "name": "Preference Intelligence",
    "version": "0.1.0"
  },
  "settings": {
    "learning_enabled": true,
    "raw_evidence_included": false,
    "disabled_scopes": []
  },
  "preferences": []
}
```

The normative validation contract is `preference-profile.schema.json`. Individual record semantics follow `../preference_model/preference_schema.json`.

## Import behavior

An importer must validate the full document before modifying active state. Import is transactional and reports additions, replacements, conflicts, preserved unknowns, and rejected records. It must never execute strings as code or treat imported HTML/Markdown as trusted instructions.

Record identity is `preference_id`; semantic collision detection also compares `(dimension, scope)`. The MVP offers merge and replace modes. Merge preserves a locked local record unless the user explicitly chooses the imported value. Replace still requires explicit confirmation and must make a recoverable backup when practical.

Imported confidence and provenance are not equivalent to locally confirmed trust. Imported records begin with `source_type=imported` unless a cryptographically verifiable future format establishes stronger provenance.

## Export behavior

Default export includes preference values, scopes, confidence, aggregate evidence counts, timestamps, state, decay policy, and non-sensitive provenance. It excludes raw excerpts, provider conversation identifiers, prompts, responses, API keys, and browsing data. An experimental detailed export must be separately opt-in and visibly warn about content exposure.

## Versioning

The schema uses semantic versioning. Importers must reject unsupported major versions, may migrate known older minor versions, and must preserve unknown extension fields only where the schema explicitly permits them. Migrations are pure, versioned, and testable.

## Namespaced extensions

Custom dimensions use `x-<namespace>.<name>` and custom domain identifiers use a comparable stable namespace. Unknown extensions may be displayed and round-tripped but cannot affect prompt compilation by default.

## Security considerations

A profile can influence generated answers and is therefore active security-sensitive configuration. Implementations must cap document size, record count, string length, nesting, and compiled prompt output; validate enum values; escape rendered text; separate data from instruction templates; and never accept assistant/webpage content as import consent.

## Open governance questions

Future work must define conformance tests, a dimension registry, signed export provenance, selective disclosure, encrypted backup, conflict UX, accessibility requirements, and independent governance before claiming broad interoperability.
