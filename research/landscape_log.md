# Landscape research log

This file is intentionally separate from `RESEARCH_LOG.md` to avoid write conflicts with other workstreams. Parent integration can append these entries later.

## 2026-09-12 — Literature search narrowed the novelty claim

- Verified peer-reviewed prior art for dynamic profiles, global/domain profiles, profile compression, interpretable summaries, latent multidimensional preferences, active elicitation, continual refinement, and contextual-bandit selection.
- Closest papers: Su et al. 2025 for global/domain profile generation and compression; PLUS 2026 for interpretable learned user summaries; PersonalAgent 2026 for continually refined profiles; S2Pref 2026 for stable versus situational preferences; PURPLE 2026 for utility-aware profile selection; PrefDisco 2026 for proactive clarification and over-personalization risk.
- Resulting gap: do not claim any component as first. Test the joint system of typed policy, hierarchical applicability, calibrated evidence/provenance, user governance, provider-neutral compilation, and cross-model evaluation.

## 2026-09-12 — Counterevidence preserved

- LUNAR (arXiv:2608.05246) reports settings where direct behavior-log retrieval outperforms compressed memory. Compression must be a falsifiable comparison, not a built-in assumption.
- PrefDisco reports 29% of naive personalization attempts worsen preference alignment relative to generic responses. Applicability gating, abstention, and clarification are core evaluation targets.
- BenchPreS, RPEval, RealPref, and LUNAR were labeled preprints because peer-reviewed publication was not established in official proceedings at the cutoff. Nonofficial acceptance claims were not promoted to publication status.

## 2026-09-12 — Product landscape changed positioning

- Rethread is the strongest documented direct competitor: cross-platform capture, local IndexedDB by default, optional encrypted sync, structured preferences, confidence, provenance, editing, selective recall, and feedback.
- Unifie combines local-first cross-AI memory with task-isolated brains and explicit response controls. Cabeza, MemoryBase, MemoryPlugin, and Supermemory also cover parts of portable memory.
- Native assistants now expose meaningful control: Claude has itemized memory/project separation and experimental import/export; ChatGPT documents sources/why-used and corrections; Gemini exposes past-chat/activity controls.
- Resulting positioning: “cross-AI memory,” “local-first,” and a generic preference category are not sufficient differentiation. Lead with response-policy semantics and measured behavioral portability.

## 2026-09-12 — Venue facts

- ARR listed 2026-10-12 as the final submission cycle for NAACL 2027 and January 2027 (exact day TBA) for ACL 2027.
- ACL announced a sustainable-reviewing capacity/service policy on 2026-09-11 applying from the October cycle; reviewer/service-contributor readiness is now a submission dependency.
- CHI 2027 (2026-09-10) and IUI 2027 (2026-08-20) paper deadlines had passed. RecSys 2027 dates were not announced. AAAI-27 was closed.
- Best default: ACL-family/TACL for the learning/benchmark claim; IUI/CHI/TiiS for a human-control contribution; RecSys for contextual utility/preference modeling.
