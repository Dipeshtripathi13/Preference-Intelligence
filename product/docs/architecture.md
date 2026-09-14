# Product architecture

Status: implemented global-first v1 architecture; contextual scope is deferred to v2.

## Design goals

The MVP is local-first, portable across providers, and transparent to its owner. V1 uses global preferences to avoid silent domain-classifier errors. The optional scope representation remains for future v2 compatibility. Its durable representation describes how to respond rather than retaining a general conversation history.

## Components

```text
Provider page
  └─ provider adapter + content boundary
       └─ typed runtime message (original user prompt, trust flag, provider)
            └─ extension service worker
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

`ProviderAdapter` contains only origin matching, composer discovery/read/write, submit-element recognition, and submission. ChatGPT and Claude implement it. Selectors live in a reviewed packaged JSON data file. Gemini is compiled as a placeholder but is not granted site access. No adapter reads assistant messages or conversation history.

### Content boundary

The content script observes trusted input events inside the active composer. On the first submit it sends the original request to the service worker, receives a compact instruction, and leaves the visible draft in the composer for review. The user edits it, submits again, or presses Escape to restore the original prompt. Failures restore the original prompt and show no Preference Intelligence UI.

### Preference engine

- `DomainClassifier`: retained only for explicit v2 research conditions; not used by the default v1 path.
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

V1 stores and retrieves global scope only. Setup choices begin at 50% evidence confidence; explicit statements activate immediately; repeated direct corrections cross the activation threshold; one direct correction replaces an onboarding value. Current-request overrides and locked records retain highest authority.

The retained v2 research precedence is:

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
