# Competitor and native-memory analysis

**Evidence cutoff:** 2026-09-12  
**Method:** public-documentation audit using official product pages, help centers, browser-store listings, and official repositories. No product was logged into or independently penetration/performance tested. “Not found” means the reviewed public sources did not document the capability; it does not prove the implementation lacks it. Product pages change quickly, so dates and URLs are part of the evidence.

## Market structure

The market has three distinct layers:

1. **Native assistant memory** — ChatGPT, Claude, and Gemini remember within their own ecosystems. These products have substantially more user visibility and control than early “black box memory” descriptions suggest.
2. **Consumer cross-AI memory** — Rethread, MemoryBase, Cabeza, Unifie, and MemoryPlugin capture or inject context across several assistants.
3. **Developer memory infrastructure** — Mem0, Letta, Zep, and Supermemory expose APIs, MCP servers, or agent runtimes for persistent context.

The proposed product sits between the first two but needs a different organizing object: an explicit policy for *how answers should be produced*, not merely a portable archive of what happened.

## Direct consumer competitors

### Rethread

Rethread is the closest documented competitor. Its [product site](https://rethread.dev/) and [architecture explanation](https://rethread.dev/how-it-works) describe a Chrome extension that observes conversations on ChatGPT, Claude, Gemini, Grok, Perplexity, and DeepSeek, stores data in browser IndexedDB by default, and optionally syncs with end-to-end encrypted cloud storage. Its [cross-platform page](https://rethread.dev/cross-platform-ai-memory.html) frames the product as one memory layer across assistants.

Rethread documents structured memory types—facts, preferences, decisions, and context—plus timestamps, source platform/conversation provenance, confidence, editing, tags/buckets, selective recall, token estimates, and per-memory feedback. That is already more than raw chat search. The reviewed pages did **not** document a bounded response-preference ontology, hierarchical domain/task inheritance, locked records resistant to passive updates, explicit decay equations, or peer-reviewed cross-model evaluation.

**Implication:** “portable local memory with preference extraction and confidence” is not a defensible differentiator. The product must compete on preference-policy semantics, applicability control, governance depth, and verified behavioral portability.

### MemoryBase

[MemoryBase](https://memorybase.io/) presents a source-linked personal context catalog, raw-source vault, export/portability, and periodic synchronization. Its official [Chrome Web Store listing](https://chromewebstore.google.com/detail/memorybase/bbdkfffldjdhpndnpcljnfccdhhacjma?hl=en) says it captures ChatGPT, Claude, and Gemini conversations; the listing snapshot reviewed showed version 0.1.34, updated 2026-06-05.

Availability is ambiguous: the homepage still described a private beta while the store carried a live listing. Public pages emphasize source-backed context rather than a structured response-preference learner. Confidence, decay, domain scopes, and preference-specific explanations were not found in the reviewed documentation.

### Cabeza

[Cabeza](https://cabeza.cc/) captures conversations from ChatGPT, Claude, and Gemini, exports clean Markdown, stores data in the user's Google Drive or Dropbox, and advertises on-device semantic search and context injection. The official [Chrome Web Store listing](https://chromewebstore.google.com/detail/cabeza/bchhfiacdpajcnlicfadfcaeaabbaaca) showed version 1.0.0, updated 2026-04-20, in the reviewed snapshot.

Cabeza markets an evolving profile and user-controlled storage, but public evidence for a typed response-preference model, confidence/provenance per preference, domain-conditioned selection, decay, or locks was not found. Drive/Dropbox ownership is user-controlled cloud storage, not the same as device-only local storage.

### Unifie

[Unifie](https://unifie.site/) documents local-first IndexedDB storage, automatic indexing across major AI chat sites, categories including identity, facts, projects, and preferences, and separate “brains” that isolate task contexts. Its [Claude integration page](https://unifie.site/integrations/claude) describes automatic retrieval/injection. A Response Control feature lets users choose modes such as concise or detailed.

Separate brains and response controls are meaningful overlap with contextual response preferences. The reviewed public pages did not establish calibrated automatic preference inference, evidence-level provenance, temporal decay, or a formal hierarchy that transfers preferences between related tasks.

### MemoryPlugin

[MemoryPlugin](https://www.memoryplugin.com/) and its [browser-extension documentation](https://help.memoryplugin.com/integrations/browser-extension) advertise support for more than 21 AI platforms through browser, MCP, API, and Custom GPT integrations. Users can edit/delete discrete memories and organize them into buckets. Smart Mode categorizes and condenses context. The service documents encryption in transit and at rest, but it is cloud-backed rather than local-first. An official [agent-skills repository](https://github.com/memoryplugin/agent-skills) extends integrations.

Public evidence for calibrated confidence, evidence provenance, domain-scoped response preferences, or decay was not found. Its breadth makes it a strong portability benchmark even though its organizing object is general memory.

### LocalBrain

The requested name resolves to [LocalBrain](https://www.localbrain.in/), a self-hosted notes/knowledge-graph and local RAG product. Its public positioning is personal knowledge search and chat over files, not cross-assistant preference learning. It is therefore an adjacent privacy/knowledge product, not a direct preference-intelligence competitor. Name ambiguity remains possible; no separate official product matching a universal AI preference layer was found under this name.

## Native assistant memory

### ChatGPT

OpenAI's current [Memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq) describes two memory sources: saved memories and information inferred from chat history. By the cutoff, the help center documented a rolling synthesized memory, automatic updates, source indicators, asking why a memory was used, correction and deletion, and controls for turning memory off. Custom Instructions remain a separate explicit-control channel.

ChatGPT therefore provides more transparency than a simple hidden summary, but its profile remains provider-bound. The public UI does not expose a typed domain/task preference schema or numeric confidence. Exporting account data is not equivalent to live model-neutral preference portability.

### Claude

Anthropic's [memory and chat-search documentation](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context) describes individual memory topics, real-time saves, project-separated memory, communication and technical preferences, sensitive-topic opt-in, exact view/edit/delete controls, source citations to past chats, pause/reset, and incognito chats. Claude also offers [memory import and export](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude), but the process is experimental and prompt/copy-paste driven rather than an always-synchronized neutral profile.

Project-separated memory is a strong native approximation of contextual scope. A provider-independent schema, automatic cross-model synchronization, exposed confidence, and formal inheritance/decay were not found in the reviewed help pages.

### Gemini

Google's [past-chat personalization help](https://support.google.com/gemini/answer/16598469?co=GENIE.Platform%3DDesktop&hl=en) documents use of previous chats, on/off controls, deletion through Gemini Apps Activity, asking whether past chats were used, and correcting the assistant in chat. The feature has account/age/activity requirements and does not apply to every Gemini surface. Google's [2025 announcement](https://blog.google/products-and-platforms/products/gemini/temporary-chats-privacy-controls/) also introduced temporary chats and related privacy controls. The [Gemini privacy hub](https://support.google.com/gemini/answer/13594961?hl=en) describes activity and imported-data handling.

The reviewed UI documentation does not expose discrete editable inferred-memory records, typed preference scopes, or cross-provider portability. Controls operate mainly at chat/activity level.

## Developer memory infrastructure

### Mem0 and OpenMemory

[Mem0 documentation](https://docs.mem0.ai/introduction) and the [open-source repository](https://github.com/mem0ai/mem0) position it as a universal memory layer for agents. It extracts facts/preferences and exposes add, search, update, and delete operations through managed and self-hosted paths. This makes Mem0 a relevant backend and generic-memory baseline, but it is developer infrastructure rather than a consumer-owned response-policy product.

Naming requires care. The older [Mem0 Chrome extension repository](https://github.com/mem0ai/mem0-chrome-extension) was archived on 2026-03-23; its README says conversations were sent to the Mem0 API, so that extension was not local-first. The current [OpenMemory repository](https://github.com/mem0ai/openmemory) is a newer CLI/TUI focused on moving coding-harness sessions, not the same browser product. Historical pages must not be used to imply that the archived extension is current.

### Letta

[Letta's documentation](https://docs.letta.com/) describes open-source stateful-agent infrastructure with persistent, editable memory blocks. Blocks can store user preferences, be attached/detached to change runtime context, and be shared by multiple agents; self-hosting is supported. Its [block tutorial](https://docs.letta.com/tutorials/attaching-detaching-blocks/) makes these mechanics explicit.

Letta is model-flexible agent infrastructure, not a browser-spanning consumer profile. Blocks are general text containers rather than a standardized preference record with calibrated evidence and cross-provider conformance.

### Zep

[Zep's official documentation](https://help.getzep.com/) describes a temporal Context Graph with entities, relationships, facts, episodes, user-level graphs, and token-efficient context blocks. It invalidates outdated facts while preserving history and supports governed context access. The [graph documentation](https://help.getzep.com/v2/understanding-the-graph) identifies raw episodes and extracted semantic facts.

Temporal validity and source-grounded graphs are important architectural prior art for decay/conflict handling. Zep targets developers and enterprise agent context, not an end-user response-style policy. Its general fact graph does not by itself answer when a preference should influence a response.

### Supermemory

[Supermemory](https://supermemory.ai/) offers memory through APIs, plugins, MCP, and a browser extension. Its official [2026 changelog](https://supermemory.ai/changelog/page/2/) documents inline relevant-memory suggestions in Claude and Gemini and cross-agent workspaces. It is a current direct-adjacent portability competitor as well as infrastructure.

The reviewed public material emphasizes saved context, documents, search, and injection. A calibrated, typed response-preference policy with hierarchical scopes, locks, and decay was not found.

## Competitive conclusions

- **Strongest direct overlap:** Rethread, because it combines cross-platform capture, local-first storage, structured preferences, confidence, provenance, editing, and selective recall.
- **Strongest native governance:** Claude's itemized memory controls and project separation; ChatGPT's current source/why-used controls are also important comparators.
- **Strongest temporal-memory substrate:** Zep; strongest agent-controlled block substrate: Letta; broad generic memory/API baselines: Mem0 and Supermemory.
- **Not differentiating alone:** browser capture, cross-model recall, local storage, a “preferences” category, semantic retrieval, editable memories, or compressed context.
- **Potentially differentiating if demonstrated together:** bounded response dimensions, scope inheritance, calibrated evidence/provenance, applicability and suppression, locks/temporary overrides, inspectable selection rationales, and behavioral equivalence across providers.

## Evidence limitations

Marketing terminology is not standardized. “Local-first” may still involve optional sync, “portable” may mean manual export, and “preference” may be an extracted fact rather than a learned response policy. Security and privacy statements were not independently audited. Store counts, versions, pricing, platform coverage, and plan eligibility are volatile; the analysis records them only where useful for status and should be rechecked before publication or launch.
