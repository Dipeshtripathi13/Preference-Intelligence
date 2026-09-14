# How Preference Intelligence works

Preference Intelligence is a user-owned response-style layer. It is not a chat
history or general AI-memory product. The launchable v1 has four parts:

1. A portable, human-readable preference profile.
2. A provider-independent engine with no DOM or browser dependency.
3. A Chrome/Chromium extension for ChatGPT and Claude.
4. A static playground that runs the same engine in the browser.

The product's defensible boundary is simple: **no account, no Preference
Intelligence server, no telemetry, and no AI-generated claims about the user.**

## What changed in global-first v1

The original prototype classified every prompt into a domain and applied scoped
preferences. That classifier remains useful research code, but it is not in the
default v1 decision path. A wrong classification could silently apply the wrong
preference, which is worse than applying a transparent global default.

V1 therefore has:

- global preferences only;
- onboarding so users receive value on the first turn;
- immediate activation of onboarding choices at 50% confidence;
- learning from explicit durable statements and repeated corrections;
- visible, editable preference injection before send;
- a second deliberate Send/Enter before the provider receives the prompt;
- one-key removal with Escape;
- silent fail-closed behavior if anything goes wrong.

The `scope` field remains optional in the portable schema. V2 can introduce
domain scope later without migrating existing global profiles.

## The complete v1 loop

```text
First run
  → compare paired answer examples
  → optionally paste existing custom instructions
  → save bounded global preferences locally

Normal request
  → observe a trusted user-composer submission
  → learn any explicit preference or correction
  → retrieve enabled global preferences above the confidence threshold
  → suppress conflicts with the current request
  → compile a bounded provider-neutral instruction
  → place the instruction visibly in the composer
  → user edits, removes, or submits it again
  → ChatGPT or Claude receives the reviewed prompt

Later correction
  → update value, confidence, evidence count, and provenance
  → use the updated preference on later turns
```

## 1. Onboarding solves the empty-profile problem

The underlying database is empty on a new installation. When the user opens the
dashboard for the first time, a six-screen onboarding flow appears. It is fully
skippable, with **Skip setup** visible on the first screen.

The user compares real answer examples instead of filling in abstract settings:

| Comparison | Stored dimension |
|---|---|
| short versus detailed | `verbosity` |
| bullet points versus prose | `format_preference` |
| code first versus explanation first | `code_preference` |
| analogy versus literal explanation | `analogy_preference` |

The final screen also includes:

- a multi-select for primary use areas;
- a paste box for existing ChatGPT custom instructions or Claude styles.

Use areas do not seed preferences. They only record which areas may be valuable
if the user later opts into contextual v2 features.

The paste parser runs locally. It recognizes only allowlisted style phrases and
discards the pasted text. For example:

```text
Keep answers concise. Use bullets and put the answer first.
```

becomes three bounded records; the original text is not retained.

### Onboarding evidence

Every setup selection is stored as:

```json
{
  "scope": {},
  "sourceType": "onboarding_declaration",
  "confidence": 0.5,
  "evidenceCount": 1,
  "state": "inferred",
  "locked": false
}
```

This is above the `0.35` activation threshold, so it works on the first turn. It
is intentionally weaker than an earned preference. One contrary direct user
correction replaces an onboarding value.

The dashboard explains provenance in plain language:

- “You chose this at setup”
- “Learned from 2 corrections”
- “Learned from your explicit instruction”
- “Set by you in the dashboard”

## 2. Only trusted user actions can teach the engine

The content script watches trusted input events inside the supported provider's
composer. At the first submit, it sends these fields to the extension-owned
background service worker:

```text
original prompt
provider identifier
trusted-user-action flag
```

Synthetic DOM changes, assistant messages, arbitrary webpage content, and
network responses cannot create preference evidence.

The extractor recognizes a bounded vocabulary, including:

- verbosity;
- technical and explanation depth;
- code and example preferences;
- analogies and step-by-step explanations;
- bullets versus prose;
- tone, mathematical depth, and citations;
- answer-first formatting.

Only allowlisted dimension/value pairs can reach the compiler. An unrestricted
language model is never asked to invent user attributes.

## 3. Dynamic preference updates

### Direct durable statements

Statements containing language such as `always`, `usually`, `by default`, `I
prefer`, or `from now on` are strong evidence:

```text
Always keep answers concise.
From now on, put the recommendation first.
I prefer professional tone and concrete examples.
```

A new direct statement starts with high confidence and can be used immediately.
A newer direct statement replaces an unlocked inferred value.

### Direct corrections

Short reactions to the prior model output are weaker evidence:

```text
Make this shorter.
Skip the basics.
Show me the implementation.
Use more concrete examples.
```

If there is no existing value, one correction is recorded below `0.35`; a
repeat raises it above the activation threshold. This prevents one situational
reaction from silently becoming a permanent default.

If a 50% onboarding value already exists, one contrary direct correction
replaces it immediately. This keeps setup useful without making it sticky.

### Confidence update policy

For evidence strength `s` and existing confidence `c`:

```text
new direct statement: min(0.90, 0.58 + 0.32s)
new direct correction: min(0.34, 0.10 + 0.25s)
matching repeat:       min(0.99, c + (1-c)(0.14 + 0.16s))
onboarding choice:     0.50
```

These are prototype engineering priors, not calibrated probabilities from a
human study.

### Conflicts, locks, and temporary requests

- Consistent evidence increases confidence.
- A new explicit statement can replace an unlocked inferred value.
- Weak contradictory evidence makes a record `ambiguous`.
- Ambiguous records are not injected.
- A locked record cannot be changed automatically.
- “For this one,” “this time,” and “just this once” control only the current
  request and never mutate the durable profile.
- The current user request always wins over a stored default.

## 4. Visible injection before send

Silent prompt rewriting is deliberately avoided.

On the first Send or Enter:

1. The original prompt is intercepted.
2. The engine learns and selects preferences.
3. A fixed, bounded instruction is placed before the original request.
4. The composed prompt remains visible in the provider composer.
5. A small notice explains that it is waiting for review.

The draft resembles:

```text
<preference-intelligence>
Apply these user-controlled response preferences only when they do not conflict
with the current request:
- Keep the response concise.
- Prefer concise bullet points.
- Lead with the answer or recommendation.
The current user request always wins.
</preference-intelligence>

--- CURRENT USER REQUEST (authoritative; verbatim) ---
Explain browser caching.
```

The user can then:

- edit any visible text;
- press Send or Enter again to send it;
- press Escape to restore the exact original prompt;
- click **Remove preferences** to restore the original prompt.

The second submit follows the provider's normal event path. It is not learned or
rewritten a second time.

### Fail-closed behavior

If the adapter cannot find the composer, the extension does not intercept the
provider action. If learning, retrieval, compilation, or prompt writing throws:

1. the original user prompt is restored;
2. no Preference Intelligence error UI is shown;
3. the provider's normal submit is attempted;
4. the user's message is never left partially rewritten.

## 5. Browser storage

Browser storage is implemented by an adapter outside the core engine. The
background service worker owns an IndexedDB database named
`preference-intelligence`:

```text
preferences  one structured record per response-style dimension
settings     onboarding, learning, and personalization controls
usageLogs    bounded apply/suppress explanations; maximum 100
```

A record contains:

```json
{
  "id": "generated-uuid",
  "dimension": "verbosity",
  "value": "concise",
  "scope": {},
  "confidence": 0.87,
  "evidenceCount": 1,
  "sourceType": "explicit_feedback",
  "state": "inferred",
  "locked": false,
  "enabled": true,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "lastObservedAt": "ISO timestamp",
  "provenance": [
    {
      "origin": "user_composer",
      "signal": "asks_for_conciseness",
      "evidenceKind": "direct_statement"
    }
  ]
}
```

Raw AI responses are never stored. Raw user prompts are not stored by default.
Only bounded signals such as `asks_for_conciseness` are retained. Experimental
raw-prompt logging requires two explicit local settings.

Because the database belongs to the extension origin, provider pages cannot
query the complete profile. ChatGPT and Claude adapters use the same local
database. Moving the profile to another device currently requires explicit JSON
export and import.

## 6. Engine, extension, schema, and playground

### DOM-free engine

`product/preference-engine` builds `@preference-intelligence/engine`. Its runtime
bundle contains no `document`, `window`, `HTMLElement`, Chrome extension API, or
IndexedDB reference.

The package exports:

- extractor and onboarding parser;
- updater and confidence policy;
- retriever and compiler;
- in-memory store interface and implementation;
- portable profile import/export;
- v2 research classifier and contextual types.

Browser storage lives in
`product/extension/src/storage/indexedDbPreferenceStore.ts`. Provider DOM logic
lives in `product/extension/src/providers`.

### Profile schema

`research/specification/preference-profile.schema.json` is the versioned,
human-readable portability contract. V1 exports global scope. Scope is optional
in the schema so future contextual records remain compatible.

### Provider selectors

Selectors are data in
`product/extension/src/providers/provider-selectors.json`, separate from adapter
logic. V1 packages the reviewed file with the extension.

The project deliberately does not download remote selector configuration at
runtime. A remote hotfix channel would introduce a network request and a new
supply-chain authority into a product whose differentiator is local ownership.
Selector updates therefore require review, tests, and a new extension build.

### Playground

The GitHub Pages playground uses the same engine and an isolated browser-local
database. It seeds example setup records so visitors can explore the mechanism
without installing the extension. Its displayed model answers are pre-generated;
the page makes no model API calls.

## 7. AI responses versus user responses

| Signal | V1 behavior |
|---|---|
| onboarding answer selection | saved globally at 50% confidence |
| pasted custom instructions | locally parsed into bounded setup declarations |
| explicit durable user statement | learned immediately |
| recognizable user correction | learned cautiously or replaces a setup value |
| repeated correction | confidence increases and may activate |
| one-time user request | controls that turn and is not stored |
| AI response text | not observed and never treated as evidence |
| AI claims “the user prefers X” | ignored |
| regenerate, copy, thumbs-down, dwell time | not observed |
| silent acceptance or abandonment | not interpreted |

V1 therefore learns from **the user's response to the model**, not from **the
model response itself**. The user remains the authority.

## Proposed response-aware v2, not implemented

Response observation may be useful later, but it must not let the model define
the user. A safe opt-in design would be:

```text
AI response completes
  → extract local non-semantic features
     word count, bullet count, code blocks, citations
  → wait for trusted user feedback
     explicit rating, correction, regenerate, accepted edit
  → join feedback to the prior turn with a local ID
  → create bounded weak evidence only when the user action supports it
  → require repetition or confirmation
  → discard response text and retain compact feature labels
```

An AI response could describe what was delivered, but could never assert what
the user prefers. Weak passive events could not override an explicit or locked
preference. Response observation would be local, opt-in, and independently
disableable.

## Code map

| Responsibility | Location |
|---|---|
| Core package build | `product/preference-engine` |
| Core engine source | `product/extension/src/engine` |
| Trusted composer boundary | `product/extension/src/content/index.ts` |
| Visible draft notice | `product/extension/src/content/indicator.ts` |
| Browser IndexedDB adapter | `product/extension/src/storage/indexedDbPreferenceStore.ts` |
| Provider selector data | `product/extension/src/providers/provider-selectors.json` |
| Provider adapters | `product/extension/src/providers` |
| Background trust boundary | `product/extension/src/background.ts` |
| Onboarding UI | `product/extension/src/dashboard/Onboarding.tsx` |
| Profile dashboard | `product/extension/src/dashboard/App.tsx` |
| Portable schema | `research/specification/preference-profile.schema.json` |

## Manual verification

1. Build and load `product/extension/dist` as an unpacked extension.
2. Open the dashboard and confirm onboarding appears.
3. Select the short answer and bullet-format examples, then finish setup.
4. Confirm both records show 50% confidence and “You chose this at setup.”
5. Open ChatGPT or Claude and write `Explain browser caching.`
6. Press Send once. Confirm the preference block is visible and nothing was sent.
7. Press Escape. Confirm the exact original prompt returns.
8. Press Send again to create the draft, edit it, then press Send a second time.
9. Write `From now on, give detailed answers.` and confirm the unlocked concise
   setup value changes.
10. Lock a record and submit a conflicting statement; confirm it does not change.
11. Inspect **Application → IndexedDB → preference-intelligence → preferences**.

Automated product coverage is in `product/extension/tests`. The research harness
and measured local-model pilot remain separate from product behavior claims.

## Explicit v1 non-goals

- domain, subdomain, or task-scoped production preferences;
- reading or storing AI responses;
- cloud sync;
- telemetry or crash reporting;
- any LLM API call by the extension;
- non-English signal extraction;
- providers beyond validated ChatGPT and Claude adapters;
- remotely downloaded selector or behavior configuration.

The implemented launch loop is:

> Choose a transparent baseline → observe trusted user corrections → update a
> readable local profile → show the compiled instruction before send → keep the
> user in control of every change.
