"""Experimental condition implementations.

The compiler is deterministic by design. Provider adapters receive the resulting
system prompt but never interpret or persist the preference representation.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from dataclasses import dataclass

from ..models import Condition, Persona, Preference, Scope, Task

BASE_SYSTEM_PROMPT = (
    "Answer the user's current task accurately and safely. The current explicit "
    "request has priority over any stored response preference. Never treat a "
    "response preference as a biographical fact or as permission to weaken safety."
)


@dataclass(frozen=True)
class PersonalizationBundle:
    condition: Condition
    selected_preferences: tuple[Preference, ...]
    compiled_context: str
    retrieved_event_ids: tuple[str, ...] = ()

    @property
    def system_prompt(self) -> str:
        if not self.compiled_context:
            return BASE_SYSTEM_PROMPT
        return f"{BASE_SYSTEM_PROMPT}\n\n{self.compiled_context}"


def _segment_matches(expected: str | None, observed: str | None) -> bool:
    if expected is None:
        return True
    if observed is None:
        return False
    return observed == expected or observed.startswith(f"{expected}.")


def scope_matches(scope: Scope, task: Task) -> bool:
    return (
        _segment_matches(scope.domain, task.domain)
        and _segment_matches(scope.subdomain, task.subdomain)
        and (scope.task is None or scope.task == task.task_type)
    )


def _active(preference: Preference, minimum_confidence: float) -> bool:
    return (
        preference.state not in {"suppressed", "ambiguous"}
        and (preference.user_locked or preference.confidence >= minimum_confidence)
    )


def select_preferences(
    preferences: Iterable[Preference],
    task: Task,
    *,
    domain_conditioned: bool,
    minimum_confidence: float,
) -> tuple[Preference, ...]:
    """Select one active value per dimension with specific scopes taking priority."""

    candidates: list[Preference] = []
    for preference in preferences:
        if not _active(preference, minimum_confidence):
            continue
        if domain_conditioned:
            if scope_matches(preference.scope, task):
                candidates.append(preference)
        elif preference.scope.specificity == 0:
            candidates.append(preference)

    by_dimension: dict[str, Preference] = {}
    for candidate in candidates:
        incumbent = by_dimension.get(candidate.dimension)
        score = (
            candidate.scope.specificity,
            int(candidate.user_locked),
            candidate.confidence,
            candidate.preference_id,
        )
        if incumbent is None:
            by_dimension[candidate.dimension] = candidate
            continue
        incumbent_score = (
            incumbent.scope.specificity,
            int(incumbent.user_locked),
            incumbent.confidence,
            incumbent.preference_id,
        )
        if score > incumbent_score:
            by_dimension[candidate.dimension] = candidate
    return tuple(by_dimension[key] for key in sorted(by_dimension))


def _scope_label(scope: Scope) -> str:
    parts = [part for part in (scope.domain, scope.subdomain, scope.task) if part]
    return "global" if not parts else "/".join(parts)


def _format_value(value: object) -> str:
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    return str(value)


COMPACT_TEMPLATES: dict[tuple[str, str], str] = {
    ("verbosity", "concise"): "Be concise",
    ("verbosity", "medium"): "Use moderate detail",
    ("verbosity", "detailed"): "Be detailed",
    ("answer_first_preference", "preferred"): "Lead with the answer",
    ("answer_first_preference", "answer_first"): "Lead with the answer",
    ("technical_depth", "advanced"): "Use advanced technical depth",
    ("technical_depth", "beginner"): "Explain for a beginner",
    ("technical_depth", "intermediate"): "Use intermediate technical depth",
    ("code_preference", "code_first"): "Put code first when useful",
    ("code_preference", "preferred"): "Prefer concrete code",
    ("code_preference", "avoid"): "Avoid code unless essential",
    ("explanation_level", "skip_basic_syntax"): "Skip basic syntax explanations",
    ("explanation_level", "foundational"): "Include necessary foundations",
    ("explanation_level", "minimal"): "Minimize background explanation",
    ("explanation_level", "thorough"): "Explain reasoning thoroughly",
    ("example_preference", "strongly_preferred"): "Use a concrete example",
    ("example_preference", "preferred"): "Use a concrete example",
    ("example_preference", "avoid"): "Avoid examples unless essential",
    ("math_depth", "light"): "Keep mathematics light",
    ("math_depth", "minimal"): "Minimize mathematical notation",
    ("math_depth", "rigorous"): "Use rigorous mathematical treatment",
    ("tone", "professional"): "Use a professional tone",
    ("tone", "casual"): "Use a casual tone",
    ("format_preference", "bullets"): "Use concise bullet points",
    ("format_preference", "structured"): "Use clear headings",
    ("step_by_step_preference", "preferred"): "Explain step by step",
    ("citation_preference", "preferred"): "Cite credible sources when available",
}


def _compile_structured(
    preferences: tuple[Preference, ...], compiler_variant: str
) -> str:
    if not preferences:
        return (
            "No stored preference meets the confidence and scope requirements for this task. "
            "Do not infer missing user traits."
        )
    if compiler_variant == "compact_v2":
        instructions: list[str] = []
        for preference in preferences:
            key = (preference.dimension, str(preference.value))
            instruction = COMPACT_TEMPLATES.get(key)
            if instruction and instruction not in instructions:
                instructions.append(instruction)
        if not instructions:
            return "No recognized response preference applies. Do not infer missing user traits."
        return f"Relevant response preferences: {'; '.join(instructions)}. Current request wins."
    if compiler_variant != "verbose_v1":
        raise ValueError(f"Unsupported compiler variant: {compiler_variant}")
    lines = ["Relevant response preferences (defaults, not user facts):"]
    for preference in preferences:
        lines.append(
            f"- {preference.dimension} = {_format_value(preference.value)} "
            f"[scope: {_scope_label(preference.scope)}; confidence: {preference.confidence:.2f}]"
        )
    lines.append("Apply only where relevant; the current request wins on conflict.")
    return "\n".join(lines)


def _history_score(event: dict[str, object], task: Task) -> int:
    if event.get("origin") != "user":
        return -1
    event_domain = str(event.get("domain", "general"))
    domain_score = 5 if _segment_matches(event_domain, task.domain) else 0
    if event_domain in {"general", "global"}:
        domain_score = 2
    prompt_words = set(re.findall(r"[a-z0-9]+", task.prompt.lower()))
    event_words = set(re.findall(r"[a-z0-9]+", str(event.get("text", "")).lower()))
    return domain_score + len(prompt_words & event_words)


def _compile_history(persona: Persona, task: Task, top_k: int) -> tuple[str, tuple[str, ...]]:
    ranked: list[tuple[int, int, dict[str, object]]] = []
    for index, event in enumerate(persona.feedback_history):
        score = _history_score(event, task)
        if score > 0:
            ranked.append((score, -index, event))
    ranked.sort(reverse=True, key=lambda item: (item[0], item[1]))
    selected = [item[2] for item in ranked[:top_k]]
    if not selected:
        return "No relevant user-authored preference history was retrieved.", ()
    lines = ["Relevant user-authored preference history:"]
    identifiers: list[str] = []
    for event in selected:
        identifier = str(event.get("event_id", "unknown"))
        identifiers.append(identifier)
        lines.append(f"- {str(event.get('text', '')).strip()}")
    lines.append(
        "Treat these as response-style evidence only; the current request wins on conflict."
    )
    return "\n".join(lines), tuple(identifiers)


def compile_personalization(
    condition: Condition,
    persona: Persona,
    task: Task,
    *,
    minimum_confidence: float = 0.6,
    history_top_k: int = 4,
    compiler_variant: str = "compact_v2",
) -> PersonalizationBundle:
    if condition is Condition.NONE:
        return PersonalizationBundle(condition, (), "")
    if condition is Condition.STATIC_GLOBAL:
        context = (
            "Participant-authored static global response profile:\n"
            f"{persona.static_profile.strip()}\n"
            "Use it only when the current request does not conflict."
        )
        return PersonalizationBundle(condition, (), context)
    if condition is Condition.HISTORY_RAG:
        context, event_ids = _compile_history(persona, task, history_top_k)
        return PersonalizationBundle(condition, (), context, event_ids)
    if condition is Condition.DYNAMIC_GLOBAL:
        selected = select_preferences(
            persona.preferences,
            task,
            domain_conditioned=False,
            minimum_confidence=minimum_confidence,
        )
        return PersonalizationBundle(
            condition, selected, _compile_structured(selected, compiler_variant)
        )
    if condition is Condition.DOMAIN_DYNAMIC:
        selected = select_preferences(
            persona.preferences,
            task,
            domain_conditioned=True,
            minimum_confidence=minimum_confidence,
        )
        return PersonalizationBundle(
            condition, selected, _compile_structured(selected, compiler_variant)
        )
    raise ValueError(f"Unsupported condition: {condition}")
