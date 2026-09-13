# Product gap analysis

**Evidence cutoff:** 2026-09-12

## Matrix interpretation

The accompanying feature matrix uses conservative labels:

- **Yes:** an official source explicitly documents the capability.
- **Partial:** an adjacent, manual, scoped, or application-dependent form is documented.
- **No:** official material establishes an incompatible condition, such as provider-bound native memory or mandatory cloud storage.
- **Unclear:** the capability was not established in the reviewed official material. This is not proof of absence.

“Preference memory” in competitor materials often means storing a sentence like “likes vegetarian food.” It should not be equated with a calibrated response policy such as “give a terse answer for routine Python debugging but teach step-by-step for unfamiliar finance tasks.”

## What is already commoditizing

The product should assume the following are table stakes rather than a moat:

- capturing conversations from multiple AI websites;
- search and context injection;
- a memory category named “preferences”;
- local-first storage or a user-controlled cloud drive;
- editing and deleting memory;
- import/export and MCP/API access;
- summary or token compression;
- source labels and, in Rethread's case, per-memory confidence/provenance;
- task separation through projects, buckets, brains, or similar containers.

Native assistants are also closing the transparency gap. ChatGPT documents source/why-used controls; Claude exposes itemized memory with source citations, project separation, pause/reset, and experimental import/export; Gemini exposes activity and past-chat controls. A new product cannot rely on “native memory is a black box” as a durable premise.

## Strongest defensible wedge

The open wedge is **preference governance plus behavioral portability**:

> A canonical, user-owned response policy that knows which preferences are applicable now, explains the evidence and uncertainty behind them, compiles them for the current model under a strict context budget, and learns safely from corrections.

This differs from portable memory in five ways.

### 1. Typed response policy

Use bounded dimensions whose meaning can be tested across providers: verbosity, structure, assumed expertise, explanation depth, directness, examples, citations, code style, tone, clarification threshold, uncertainty presentation, and decision-support mode. Keep factual identity and project state in separate memory classes.

The differentiation is not the JSON schema. It is reliable behavior when one profile is rendered for heterogeneous models.

### 2. Hierarchical applicability

Represent scope as global → domain → subdomain → task → temporary situation, with explicit inheritance and conflict rules. Existing “projects,” “brains,” and buckets isolate contexts but do not publicly establish transferable inheritance semantics. The selector should be able to suppress a related but inappropriate preference and expose its rationale.

### 3. Evidence and control

Each inferred record should show the supporting interaction, evidence type, confidence, last confirmation, and applicability. Users should be able to confirm, reject, edit, lock, delete, and temporarily override it. A lock must prevent weak passive evidence from silently rewriting an explicit choice. Deletion should remove the record and its derived representations.

### 4. Provider-neutral compilation

Adapters should translate the same canonical policy into the instruction surface each provider actually supports. Portability needs a conformance suite measuring outcome equivalence, conflict with the current user request, token cost, and degradation after model changes. Data export alone does not prove portability.

### 5. Safe learning loop

Passive signals should create hypotheses, not facts. The update loop needs authority tiers, calibration, decay, and a decision among apply, ignore, or ask. Over-personalization controls are a core feature because current research shows naive personalization can reduce preference alignment.

## Positioning against the closest alternatives

| Alternative | Their strength | Positioning response |
|---|---|---|
| Rethread | Most complete documented cross-AI structured memory; local-first, confidence, provenance, selective recall | Do not compete as “memory everywhere.” Demonstrate richer scoped policy semantics, locks/overrides, applicability, and cross-model behavioral tests. |
| Unifie | Local-first cross-AI context, separate brains, explicit response controls | Automate evidence-based preference learning while retaining exact control; support scope inheritance rather than isolated containers alone. |
| MemoryPlugin / Supermemory | Broad integrations and memory injection | Offer a focused preference control plane and interoperable profile; integrate with generic memory rather than replacing every knowledge connector. |
| Mem0 / Letta / Zep | Mature developer memory primitives, self-hosting or temporal context | Treat as potential storage/backends and evaluation baselines; add end-user policy semantics and UI. |
| ChatGPT / Claude / Gemini | Deep native integration and low friction | Win on provider neutrality, unified controls, explicit scopes, and consistent behavior; accept that native integrations may retain richer proprietary signals. |

## Product promise and proof standard

“Your preferences. Every AI.” is a strong aspiration, but launch claims should match evidence. Suggested staged wording:

- **Prototype:** “One editable preference profile for ChatGPT and Claude.”
- **Evaluated beta:** “A consistent preference profile tested across supported AI models.”
- **Long-term:** “Your preferences. Every AI.”

Every supported integration should publish a conformance result: dimensions tested, model/version/date, adherence, irrelevant-preference error, token overhead, and known limitations. Future models cannot be covered prospectively.

## Minimum differentiated product

The minimum product that tests this wedge should include:

1. A local canonical profile separated into response preferences, factual memory, and project context.
2. Ten to fifteen bounded preference dimensions with global/domain/task scopes.
3. Evidence-linked confidence, explicit confirmation, correction, lock, delete, and session override.
4. A selector that emits an inspectable “applied / suppressed / asked” decision under a token budget.
5. ChatGPT and Claude adapters first, then Gemini and an open-weight model.
6. Before/after feedback tied to the applied preference records.
7. Export/import in a documented vendor-neutral format.
8. A local evaluation dashboard for adherence, overrides, and context cost.

Generic transcript search, large connector catalogs, and team knowledge bases can remain integrations or later features. Building them first would move the product into a crowded general-memory market.

## Risks to differentiation

- Rethread or native providers may add the same controls quickly; the response should be an open specification and reproducible evaluation, not feature count alone.
- Browser DOM integrations are brittle and may conflict with site terms or UI changes.
- Provider APIs and browser products expose different instruction precedence, limiting equivalence.
- Automatic preference inference can feel invasive even when local; transparency does not guarantee consent.
- A rigid ontology can misrepresent nuanced preferences; allow free-text escape hatches without making them the default.
- A rich profile can increase privacy impact and fingerprintability; data minimization and selective disclosure are required.

## Validation gates

Continue toward the preference-layer thesis only if tests show:

- higher relevant preference adherence than native instructions, generic memory, and full-history retrieval;
- no material task-quality loss on irrelevant-preference controls;
- useful calibration—low-confidence inferences are actually less accurate, and asking helps;
- lower token use or latency at comparable utility;
- cross-provider behavior is acceptably consistent;
- users can predict, understand, and correct system behavior;
- local capture and deletion work as documented.

If not, the strongest outcome may be a vendor-neutral profile specification, conformance benchmark, or governance UI that plugs into existing memory providers rather than a standalone memory product.
