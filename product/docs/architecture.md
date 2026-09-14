# Product architecture

Status: preliminary implementation architecture.

## Design goals

The MVP is local-first, portable across providers, contextual by scope, and transparent to its owner. Its durable representation describes how to respond rather than retaining a general conversation history. Provider adapters are replaceable; the preference engine has no provider-specific record fields.

## Components

```text
Provider page
  └─ provider adapter + content boundary
       └─ typed runtime message (original user prompt, trust flag, provider)
            └─ extension service worker
                 ├─ DomainClassifier
                 ├─ PreferenceExtractor → PreferenceUpdater
                 ├─ PreferenceRetriever → ApplicabilityEvaluator → PreferenceRanker
                 ├─ ContextCompiler
                 └─ IndexedDbPreferenceStore
                      ├─ preferences
                      ├─ settings
                      └─ bounded decision logs

Dashboard / popup ── typed runtime messages ──┘
```

### Provider adapters

`ProviderAdapter` contains only origin matching, composer discovery/read/write, submit-element recognition, and submission. ChatGPT and Claude implement it. Gemini is compiled as a placeholder but is not granted site access. No adapter reads assistant messages or conversation history. A small shadow-DOM indicator renders bounded compile decisions without receiving the complete profile.

### Content boundary

The content script observes trusted input events inside the active composer. At submit time it compares the current composer to its last trusted snapshot. A mismatch can still be personalized but cannot update the profile. The script sends the original request to the service worker, receives a compact instruction, places that block first, and leaves the authoritative user request verbatim last.

### Preference engine

- `DomainClassifier`: conservative keyword taxonomy, independently replaceable.
- `PreferenceExtractor`: bounded signals from trusted user-composer actions only.
- `PreferenceUpdater`: evidence-confidence accumulation, explicit replacement, contradiction state, update events, and lock enforcement.
- `PreferenceRetriever`: hierarchy matching, decay, experiment filtering, and complete bounded apply/suppress decisions.
- `ApplicabilityEvaluator`: hard scope compatibility plus dimension/task relevance and evidence-confidence components.
- `PreferenceRanker`: deterministic prompt-budget ordering.
- `ContextCompiler`: safe templates, current-turn conflict suppression, selected-record explanations.
- `PreferenceStore`: interface with IndexedDB and in-memory implementations.

The compiler never interpolates an arbitrary imported value. A dimension/value pair must pass a bounded allowlist and map to a known behavioral template.

### Storage

IndexedDB is opened in the extension service worker. Site content scripts do not have profile-store access. Preferences contain evidence confidence, lifecycle state, scope, timestamps, lock/enable controls, bounded provenance labels, optional expiration and scoped negative-applicability evidence, and no raw excerpt. Usage logs retain at most 100 entries. They are metadata-only unless raw logging is explicitly enabled in experimental mode.

### UI

The dashboard uses the same message boundary for CRUD and settings. “Why used?” joins a preference to its latest selection/suppression decision. Import is validated completely before writes. Export follows the research interoperability schema and always reports `raw_evidence_included: false`.

## Scope and precedence

For one dimension, the highest-authority candidate at the most specific matching scope wins:

```text
current request
  > locked / confirmed matching task scope
  > matching subdomain scope
  > matching domain scope
  > global fallback
```

Specific scopes do not match sibling or unrelated top-level domains. Thus Java technical depth cannot enter a physics prompt. A domain `education` verbosity record outranks a global verbosity record for education prompts. Locked state increases authority but never bypasses scope, contextual applicability, expiration, or an explicit current-request override.

## Extension build

Vite builds dashboard and popup HTML. Esbuild separately bundles content and background entries into classic self-contained scripts required by their Manifest V3 execution contexts. The manifest is copied from `public/` into `dist/`.
