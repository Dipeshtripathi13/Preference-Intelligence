# Preference Intelligence product MVP

**Your preferences. Every AI.**

This directory contains a local-first Chrome/Chromium extension that demonstrates a provider-independent preference layer. It learns a bounded set of response preferences from trusted, user-authored corrections; selects only preferences relevant to the current domain and task; and compiles compact guidance for ChatGPT or Claude. The profile remains inspectable and editable in the extension dashboard.

This is a research prototype. The implementation demonstrates the mechanism; it does not establish that personalization improves response quality.

## What works

- Deterministic domain/subdomain and task classification
- Multi-domain candidates plus fixed-income and infrastructure classification rules
- Global, domain, subdomain, and task-scoped retrieval through a distinct applicability evaluator
- Inspectable scope match, semantic relevance, evidence confidence, final applicability, and suppression decisions
- Named evidence hierarchy, gradual repeated-correction updates, decay, direct-statement precedence, and conflict abstention
- Current-request precedence over every stored preference
- ChatGPT and Claude adapters behind a common provider interface
- Background-owned IndexedDB profile and bounded decision log
- Dashboard controls to inspect, add, edit, confirm, lock, disable, delete, reset, and review applied/rejected traces
- Small in-provider “Using N preferences” indicator with context-specific “wasn't relevant here” feedback
- Per-domain disable controls and global learning/personalization switches
- “Why used?” decisions with scope, confidence, source, and selection reason
- Canonical `0.1.0` JSON profile import/export compatible with [`research/specification/preference-profile.schema.json`](../research/specification/preference-profile.schema.json)
- Portable temporary expirations and scoped negative applicability evidence
- Internal conditions for no personalization, static profile, global learned profile, and domain-conditioned profile
- Opt-in raw-prompt experiment logging; off by default

Gemini has an adapter placeholder but is intentionally absent from the manifest until its selectors and end-to-end behavior are validated.

## Development

Requirements: Node.js 20 or newer and npm.

```bash
cd product/extension
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

To try the production extension:

1. Open `chrome://extensions` in Chrome or Chromium.
2. Enable Developer mode.
3. Choose **Load unpacked** and select `product/extension/dist`.
4. Pin the extension, then open ChatGPT or Claude.
5. Open the extension popup and choose **View and control profile**.

Provider DOMs change independently of this project. If injection stops working, check the selectors in `src/providers/` and update their adapter tests. Test the extension with non-sensitive prompts first.

## Privacy defaults

The extension has no Preference Intelligence server, analytics, cookies, API keys, or broad host access. The manifest declares no generic permissions. Content scripts run only on ChatGPT and Claude origins. Full responses are never observed. The durable profile stores compact records and evidence labels rather than raw chat text.

Every prompt necessarily remains visible to the provider the user chose. Raw prompts are not retained by this extension unless the user explicitly enables both experimental mode and raw-prompt logging. Export and import are explicit user actions.

See [architecture](docs/architecture.md), [data flow](docs/data_flow.md), and [security/privacy](docs/security_privacy.md) for boundaries and limitations.

The historical audit and resulting change report are in
[`CURRENT_PRODUCT_AUDIT.md`](docs/CURRENT_PRODUCT_AUDIT.md) and
[`PRODUCT_REVIEW_AND_CHANGES.md`](docs/PRODUCT_REVIEW_AND_CHANGES.md). Live
provider validation follows [`EXTENSION_MANUAL_TEST.md`](docs/EXTENSION_MANUAL_TEST.md).

## Directory map

```text
product/
├── docs/                  # Architecture, threat model, and ADRs
├── extension/
│   ├── public/manifest.json
│   ├── src/background.ts  # Trusted store and message boundary
│   ├── src/content/       # Composer interception and prompt composition
│   ├── src/dashboard/     # Transparent control surface
│   ├── src/engine/        # Classify, extract, update, retrieve, rank, compile
│   ├── src/providers/     # Provider adapters
│   └── tests/
└── IMPLEMENTATION_LOG.md
```

## Known limitations

- Provider integration is selector-based and requires periodic compatibility checks.
- The rules-based classifier and extractor are deliberately conservative and English-only.
- Multi-domain alternatives are visible, but the MVP selects one primary domain for preference application.
- Evidence and applicability scores are engineering priors, not calibrated probabilities.
- A browser extension cannot defend its local database from a fully compromised browser profile or device.
- Profile merge protects same-ID locked records; semantic duplicate reconciliation remains future work.
- The extension cannot alter provider-side retention, model behavior, or safety policy.
- No real-user effectiveness results have been collected.
- Provider adapters have unit-tested selectors but still need live browser smoke testing against current ChatGPT and Claude DOMs.
