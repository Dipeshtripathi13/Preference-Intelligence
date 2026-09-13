# Literature review: portable preference intelligence for language models

**Evidence cutoff:** 2026-09-12  
**Scope:** systems that infer, represent, retrieve, update, and apply an individual user's response preferences. General conversational memory is included only where it changes the design space. Peer-reviewed work is separated from preprints. Citation keys resolve in `references.bib`.

## Executive synthesis

The literature does not support treating “a profile that changes by domain” or “a natural-language user summary” as novel on its own. LaMP established retrieval-based personalization tasks [@salemi-etal-2024-lamp]; subsequent systems learned user embeddings, per-user adapters, latent preference dimensions, natural-language summaries, evolving profiles, domain-specific profiles, and utility-aware selectors [@tan-etal-2024-democratizing; @liu-etal-2025-llms; @li-etal-2025-prefpalette; @nam-etal-2026-plus; @su-etal-2025-personalized; @du-etal-2026-optimizing]. By 2026, dynamic and situational preference benchmarks explicitly distinguish stable from context-specific preferences [@gao-etal-2026-beyond], and interactive benchmarks show that uninformed personalization can be worse than a generic response [@li-etal-2026-prefdisco].

The defensible gap is narrower and more useful: a **provider-neutral, user-governed preference policy** that combines (1) bounded, typed response dimensions; (2) hierarchical scope; (3) calibrated uncertainty and evidence provenance; (4) locks, corrections, temporary overrides, negative preferences, and decay; (5) context-budgeted selection with an explanation of why each item was applied; and (6) evaluation across model families for both benefit and over-personalization. No reviewed peer-reviewed paper demonstrates that full bundle, and public product documentation does not establish it either. This is an absence-of-evidence statement, not a priority claim.

## What counts as preference intelligence

This review separates four objects that are often conflated:

1. **Conversation memory** retains episodes or summaries so an assistant can continue prior work.
2. **Fact memory** stores propositions about a user, such as occupation or location.
3. **Preference intelligence** estimates how the user wants an answer produced or a choice made, conditional on the task and situation.
4. **Personalized alignment** changes generation or ranking so outputs better match an individual's utility.

A system can have excellent memory without a useful preference model. Conversely, a preference learner may need only sparse comparisons rather than a long transcript. The distinction matters because the target product is a control layer over multiple generators, not a replacement chatbot.

## Foundations

Earlier personalization work supplied three foundations. Persona-conditioned dialogue encoded speaker identities or explicit persona sentences [@li-etal-2016-persona; @zhang-etal-2018-personalizing]. User modeling and adaptive hypermedia established persistent, inspectable models and adaptation as distinct system components [@kobsa-2001-generic; @brusilovsky-2001-adaptive]. Recommender systems formalized context-aware preference prediction and learning from implicit signals, including the warning that observed behavior is not equivalent to positive preference [@adomavicius-2011-context-aware; @hu-etal-2008-collaborative]. Modern preference optimization, such as DPO, learns population-level behavior from comparisons but does not by itself maintain a portable per-user state [@rafailov-etal-2023-dpo].

These foundations imply two requirements for the present problem. First, preference evidence has heterogeneous authority: an explicit correction should normally outweigh passive behavior. Second, scope is part of the preference. “Use concise answers” can be valid for debugging and invalid for a tutorial.

## Retrieval and profile-conditioned generation

LaMP introduced seven tasks that combine a current input with a retrieved user profile or history and showed consistent gains from personalized retrieval [@salemi-etal-2024-lamp]. PEARL trains generation-calibrated retrievers over a user's authored documents for writing assistance [@mysore-etal-2024-pearl]. LongLaMP extends evaluation to long-form generation [@kumar-etal-2024-longlamp]. These methods make personalization portable at the prompt level, but the profile is generally history or documents rather than an editable preference policy.

Profile compression is now established prior art. Su et al. dynamically generate global and domain profiles and compress domain information into keywords for personalized QA [@su-etal-2025-personalized]. PRIME separates episodic and semantic memory and models an evolving personalized thought process [@zhang-etal-2025-prime]. PURPLE treats profile-item selection as a contextual-bandit problem, optimizing downstream utility rather than semantic similarity alone [@du-etal-2026-optimizing]. PersonaMem-v2 reports an agentic compressed-memory approach, but it remains a preprint at this cutoff [@jiang-etal-2025-personamem-v2].

This line supports context-efficient selection, but it does not establish that compression always wins. The very recent LUNAR preprint reports that direct behavior-log retrieval can outperform compressed memory in its evaluated settings [@zhang-etal-2026-lunar]. That result should be treated as a counter-hypothesis to reproduce, not as settled consensus.

## Learned user representations and model adaptation

OPPU trains one parameter-efficient module per user [@tan-etal-2024-democratizing]. PPlug encodes all user histories into a user embedding and plugs it into the LLM [@liu-etal-2025-llms], while a related user-embedding module conditions prompts [@doddapaneni-etal-2024-user]. StyleVector uses contrastive activation steering for personalized text generation [@zhang-etal-2025-personalized]. Drift and CoPe alter decoding using inferred or contrasted preferences [@kim-etal-2025-drift; @bu-etal-2025-personalized]. Fine-grained linguistic control directly represents stylistic attributes [@alhafni-etal-2024-personalized].

These methods show that latent or model-internal representations can personalize effectively. Their main mismatch with a universal layer is coupling: adapters, embeddings, hidden-state directions, and personalized decoders are tied to a model family or require privileged inference access. They also make exact user inspection and cross-provider transfer harder than a typed external profile.

## Preference elicitation and personalized alignment

PersonalLLM creates heterogeneous simulated users from reward models and studies sparse continual feedback [@zollo-etal-2025-personalllm]. AMPLe actively asks comparisons to learn multidimensional preferences [@oh-etal-2025-comparison]. Interaction-based alignment learns individual preferences through dialogue [@wu-etal-2025-aligning]. PrefPalette, a COLM 2025 spotlight, models preferences with latent attributes [@li-etal-2025-prefpalette]. AlignX scales user-level alignment data to more than one million users [@li-etal-2026-1000000].

PLUS jointly learns an interpretable natural-language user summary and a personalized reward model; its reported generalization and transparency make it especially close to the proposed representation goal [@nam-etal-2026-plus]. PrefDisco studies cold-start, context-dependent preferences and strategic questioning; across its evaluation, 29% of naive personalization attempts reduce preference alignment relative to generic answers [@li-etal-2026-prefdisco]. The operational lesson is that confidence thresholds and clarification are not optional polish: they are safety mechanisms against harmful over-application.

## Dynamic, contextual, and long-horizon preferences

Evolving Conditional Memory evaluates dialogue continuation, personalized knowledge, and learning from feedback [@yuan-etal-2025-personalized]. PersonaMem evaluates dynamic user profiling across more than 180 simulated histories, up to 60 sessions and 15 tasks; reported frontier-model accuracy is about 50% [@jiang-etal-2025-personamem]. PersonalAgent continually refines a unified profile for proactive personalization [@zhang-etal-2026-towards]. S2Pref explicitly distinguishes stable and situational preferences, introduces preference conflicts and clarification, and contains 10,000 examples [@gao-etal-2026-beyond]. CoPA contributes 1,985 profiles across StackExchange domains and six data-informed cognitive factors [@su-etal-2026-copa].

The benchmark trend is away from a single static persona. The strongest emerging formulation is a policy over `(user, task, domain, situation, time)`. A hierarchical scope such as global → domain → subdomain → task is therefore plausible, but the correct hierarchy and transfer rules remain empirical questions.

## Evaluation evidence and benchmark limitations

PrefEval supplies 3,000 manually curated preference–query pairs over 20 topics, with explicit and implicit evidence and contexts up to 100,000 tokens. In its zero-shot tests, preference-following falls below 10% after roughly ten turns for most evaluated models, and prompting or RAG still deteriorate with longer context [@zhao-etal-2025-prefeval]. PersonaLens evaluates conversational personalization along multiple capabilities [@zhao-etal-2025-personalens]. Surveys identify fragmented definitions, mostly offline evaluation, synthetic users, and inconsistent metrics as recurring limitations [@tseng-etal-2024-two; @chen-etal-2024-recent; @guan-etal-2025-survey].

New 2026 preprints extend the risk side. BenchPreS studies selective suppression when preferences should not govern social or institutional contexts [@yoon-etal-2026-benchpres]. RPEval tests whether irrelevant preferences interfere with rational task solving [@feng-etal-2026-rpeval]. RealPref introduces longer-horizon profiles and varied expression forms but is still synthetic and relies partly on LLM judging [@guo-etal-2026-realpref]. These are useful evaluation candidates, not peer-reviewed facts at the cutoff.

Evaluation should therefore measure at least:

- task quality and preference adherence separately;
- over-personalization when a stored preference is irrelevant;
- conflict handling, correction latency, calibration, and abstention/clarification;
- transfer across domains and negative transfer across unrelated domains;
- portability across several proprietary and open-weight model families;
- prompt tokens, latency, and cost against full-history and retrieval baselines;
- human-rated usefulness, predictability, control, and perceived creepiness;
- subgroup disparities and privacy leakage from inferred profiles.

## General memory systems: relevant but not equivalent

Generative Agents combines an observation stream with reflection and retrieval [@park-etal-2023-generative]. MemoryBank adds long-term conversational memory with a forgetting-inspired update mechanism [@zhong-etal-2023-memorybank]. MemGPT treats context as a memory hierarchy managed by an agent [@packer-etal-2023-memgpt]. Mem0 extracts and retrieves compact memories and reports memory-benchmark gains [@chhikara-etal-2025-mem0]. Zep uses a temporal knowledge graph for evolving facts [@rasmussen-etal-2025-zep].

These systems contribute mechanisms for provenance, temporal validity, retrieval, and compression. They usually optimize broad factual/episodic recall rather than an explicit response-style policy. They are appropriate infrastructure baselines, while LaMP-, PrefEval-, PLUS-, S2Pref-, and PrefDisco-style systems are closer scientific comparators.

## What the evidence supports

The reviewed work supports six cautious conclusions:

1. Relevant user history often improves personalized generation, but naive retrieval is not enough.
2. Preferences are multidimensional, time-varying, and conditional on context.
3. Explicit and implicit evidence should not be treated as equally reliable.
4. A compact interpretable profile can work well, but the compression-versus-retrieval trade-off is dataset-dependent.
5. Personalization can reduce utility when irrelevant or weakly inferred preferences are applied.
6. Cross-model portability, end-user governance, and calibrated online updating are rarely evaluated together.

The final claim is the project's most credible opening. It still requires a reproducible systematic-review protocol and an empirical artifact before it can become a publication-level novelty claim.

## Review method and limitations

Search and verification focused on ACL Anthology, official ICLR proceedings, official COLM lists/OpenReview links, arXiv records, and authors' repositories. Included work was selected for direct relevance to profile representation, preference inference, retrieval, adaptation, longitudinal updating, or evaluation. The review is structured rather than systematic: it does not report database-wide query strings, duplicate screening, or inter-rater inclusion agreement. Papers after the cutoff and unverified acceptance claims are excluded. Preprints are labeled; numerical results are attributed to their source and were not independently reproduced.
