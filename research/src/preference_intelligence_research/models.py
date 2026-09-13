"""Typed, provider-independent experiment data models."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class Condition(str, Enum):
    """Personalization arms defined in the experimental design."""

    NONE = "no_personalization"
    STATIC_GLOBAL = "static_global"
    HISTORY_RAG = "history_rag"
    DYNAMIC_GLOBAL = "dynamic_global"
    DOMAIN_DYNAMIC = "domain_dynamic"


@dataclass(frozen=True)
class Scope:
    """Canonical global/domain/subdomain/task preference scope."""

    domain: str | None = None
    subdomain: str | None = None
    task: str | None = None

    @classmethod
    def from_dict(cls, value: dict[str, Any] | None) -> Scope:
        value = value or {}
        return cls(
            domain=value.get("domain"),
            subdomain=value.get("subdomain"),
            task=value.get("task"),
        )

    def to_dict(self) -> dict[str, str | None]:
        return {"domain": self.domain, "subdomain": self.subdomain, "task": self.task}

    @property
    def specificity(self) -> int:
        return sum(item is not None for item in (self.domain, self.subdomain, self.task))


@dataclass(frozen=True)
class Preference:
    """Projection of the canonical preference-record contract used by experiments."""

    preference_id: str
    dimension: str
    value: str | float | bool | list[str]
    scope: Scope
    confidence: float
    state: str = "inferred"
    source_type: str = "experiment"
    user_locked: bool = False
    evidence_count: int = 0
    provenance: tuple[dict[str, Any], ...] = ()

    @classmethod
    def from_profile_record(cls, value: dict[str, Any]) -> Preference:
        return cls(
            preference_id=str(value["preference_id"]),
            dimension=str(value["dimension"]),
            value=value["value"],
            scope=Scope.from_dict(value.get("scope")),
            confidence=float(value["confidence"]),
            state=str(value.get("state", "inferred")),
            source_type=str(value.get("source_type", "imported")),
            user_locked=bool(value.get("user_locked", False)),
            evidence_count=int(value.get("evidence_count", 0)),
            provenance=tuple(value.get("provenance", [])),
        )

    def to_log_dict(self) -> dict[str, Any]:
        return {
            "preference_id": self.preference_id,
            "dimension": self.dimension,
            "value": self.value,
            "scope": self.scope.to_dict(),
            "confidence": self.confidence,
            "state": self.state,
            "source_type": self.source_type,
            "user_locked": self.user_locked,
            "evidence_count": self.evidence_count,
            "provenance": list(self.provenance),
        }


@dataclass(frozen=True)
class Persona:
    id: str
    label: str
    description: str
    static_profile: str
    preferences: tuple[Preference, ...]
    feedback_history: tuple[dict[str, Any], ...]


@dataclass(frozen=True)
class Task:
    id: str
    split: str
    template_family: str
    domain: str
    subdomain: str | None
    task_type: str
    difficulty: str
    prompt: str
    reference_points: tuple[str, ...]
    automatic_checks: dict[str, Any]
    human_emphasis: tuple[str, ...]


@dataclass(frozen=True)
class GenerationRequest:
    model: str
    system_prompt: str
    user_prompt: str
    temperature: float
    max_output_tokens: int
    seed: int
    reasoning_effort: str | None = None


@dataclass(frozen=True)
class GenerationResult:
    text: str
    returned_model: str | None
    model_version: str | None
    input_tokens: int | None
    output_tokens: int | None
    finish_reason: str | None
    raw_metadata: dict[str, Any] = field(default_factory=dict)
