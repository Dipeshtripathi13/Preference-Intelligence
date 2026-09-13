# Security and privacy threat model

Status: design analysis for a preliminary implementation, not a security certification.

## Assets and trust boundaries

Protected assets are the preference profile, compact provenance, experimental logs, and private current prompt. The extension service worker and extension pages are trusted. Provider pages, assistant output, retrieved documents, and arbitrary webpage content are untrusted. The user's direct interactions with a recognized provider composer or dashboard are authoritative within the limits below.

## Controls

| Threat | Control | Residual risk |
|---|---|---|
| Assistant hallucination becomes profile fact | Adapters never read assistant messages; extractor accepts only `user_composer` origin | A user who copies assistant text into the composer makes it indistinguishable from authored text |
| Webpage prompt injection poisons preferences | No page-text ingestion; trusted input snapshot must equal composer at submit; no `externally_connectable` API | A compromised provider page can visually deceive a user or race DOM mutations; mismatch disables learning but cannot guarantee UI integrity |
| Arbitrary runtime caller reads profile | Background validates extension-page senders for CRUD/export and allowlisted tab origins for compile | Another malicious extension or a fully compromised browser is outside this boundary |
| Cross-site private data leakage | Content scripts receive compiled behavioral instructions, not the full profile or other conversations | A selected preference is intentionally portable and is sent to the chosen provider |
| Malicious imported profile injects prompt text | Entire profile validated first; bounded dimensions/values only; compiler uses fixed templates | A valid but misleading preference can affect output until user reviews/deletes it |
| Import overwrites user lock | Merge skips existing same-ID locked records; replacement requires explicit action | Different IDs with semantically duplicate scope/dimension need future conflict UI |
| Raw chat retention | Responses are never captured; raw prompts off by default; preference evidence uses compact labels; logs bounded to 100 | IndexedDB and explicit exports are readable to someone with device/browser-profile access |
| Sync leakage | No browser sync or cloud service | Users may manually upload exported profiles elsewhere |
| API-key theft | No API keys or direct model API calls | Provider sites retain their own authenticated sessions independently |
| Overbroad site access | Manifest contains only ChatGPT/Claude match patterns and zero generic permissions | Those providers' full page DOM is visible to their respective content script execution contexts |
| Stored preference fights current request | Conflicting dimensions are suppressed; compiled defaults precede a verbatim current request and state that it wins | Models are probabilistic and may still fail to follow hierarchy |
| Local database compromise | Extension-origin IndexedDB isolates sites; CSP permits self scripts only | Malware, browser compromise, or unlocked OS account can access local data |

## Data minimization

The normal profile stores no raw chat, assistant response, embedding, demographic attribute, or browsing history. Provenance is limited to a signal label such as `asks_for_conciseness`, its trusted origin, source category, and time. Only supported response-style dimensions are inferable. Sensitive traits and general biographical memory are non-goals.

## Permission inventory

The manifest declares `permissions: []`. Host-scoped content script matches are limited to:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://claude.ai/*`

There is no wildcard host permission, network fetch, cookies access, browsing-history access, clipboard access, downloads permission, native messaging, or external messaging endpoint.

## Incident response for a local user

Pause personalization and learning from the dashboard, inspect each preference and its source, delete suspicious records or disable their domain, clear logs, and use Reset profile if necessary. Uninstalling the extension removes its extension-origin storage under normal Chromium behavior; exported JSON files must be deleted separately by the user.
