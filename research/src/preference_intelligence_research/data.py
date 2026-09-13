"""Benchmark and portable-profile loading with lightweight contract validation."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from .models import Persona, Preference, Scope, Task

CANONICAL_DIMENSIONS = {
    "verbosity",
    "technical_depth",
    "explanation_level",
    "code_preference",
    "example_preference",
    "analogy_preference",
    "format_preference",
    "step_by_step_preference",
    "tone",
    "math_depth",
    "citation_preference",
    "answer_first_preference",
}
EXTENSION_DIMENSION = re.compile(r"^x-[a-z0-9][a-z0-9._-]*$")


class DataValidationError(ValueError):
    """Raised when benchmark/profile data violate the experiment contract."""


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise DataValidationError(f"Cannot load JSON from {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise DataValidationError(f"Top-level JSON value in {path} must be an object")
    return value


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def _check_dimension(dimension: object) -> str:
    if not isinstance(dimension, str):
        raise DataValidationError("Preference dimension must be a string")
    if dimension not in CANONICAL_DIMENSIONS and not EXTENSION_DIMENSION.fullmatch(dimension):
        raise DataValidationError(f"Unsupported preference dimension: {dimension}")
    return dimension


def validate_profile_contract(profile: dict[str, Any]) -> None:
    """Validate fields relied upon by the runner.

    This dependency-free guard is intentionally narrower than JSON Schema. Tests
    optionally run the full canonical schema when ``jsonschema`` is installed.
    """

    required = {
        "schema_version",
        "profile_id",
        "created_at",
        "updated_at",
        "generator",
        "settings",
        "preferences",
    }
    missing = sorted(required - profile.keys())
    if missing:
        raise DataValidationError(f"Profile missing required fields: {', '.join(missing)}")
    if profile["schema_version"] != "0.1.0":
        raise DataValidationError("Runner currently supports profile schema_version 0.1.0")
    if not isinstance(profile["preferences"], list):
        raise DataValidationError("Profile preferences must be an array")
    for index, record in enumerate(profile["preferences"]):
        if not isinstance(record, dict):
            raise DataValidationError(f"Preference {index} must be an object")
        for field in ("preference_id", "dimension", "value", "scope", "confidence"):
            if field not in record:
                raise DataValidationError(f"Preference {index} missing {field}")
        _check_dimension(record["dimension"])
        confidence = record["confidence"]
        if not isinstance(confidence, (float, int)) or isinstance(confidence, bool):
            raise DataValidationError(f"Preference {index} confidence must be numeric")
        if not 0 <= float(confidence) <= 1:
            raise DataValidationError(f"Preference {index} confidence must be within [0, 1]")
        scope = record["scope"]
        if not isinstance(scope, dict) or set(scope) != {"domain", "subdomain", "task"}:
            raise DataValidationError(
                f"Preference {index} scope must contain exactly domain, subdomain, task"
            )


def load_profile_preferences(path: Path) -> tuple[Preference, ...]:
    profile = _read_json(path)
    validate_profile_contract(profile)
    return tuple(Preference.from_profile_record(item) for item in profile["preferences"])


def _synthetic_preference(
    persona_id: str, scope: Scope, record: dict[str, Any]
) -> Preference:
    dimension = _check_dimension(record.get("dimension"))
    raw_value = record.get("value")
    if isinstance(raw_value, bool | str):
        preference_value: str | float | bool | list[str] = raw_value
    elif isinstance(raw_value, int | float):
        preference_value = float(raw_value)
    elif isinstance(raw_value, list) and all(isinstance(item, str) for item in raw_value):
        preference_value = raw_value
    else:
        raise DataValidationError(f"Unsupported value for {dimension}: {raw_value!r}")
    scope_name = ".".join(item for item in scope.to_dict().values() if item) or "global"
    preference_id = f"synthetic:{persona_id}:{scope_name}:{dimension}"
    return Preference(
        preference_id=preference_id,
        dimension=dimension,
        value=preference_value,
        scope=scope,
        confidence=float(record.get("confidence", 1.0)),
        state="confirmed",
        source_type="experiment",
        user_locked=False,
        evidence_count=1,
        provenance=(
            {
                "actor": "local_inference",
                "component": "synthetic-benchmark-loader",
                "version": "0.1.0",
            },
        ),
    )


def load_personas(path: Path) -> tuple[Persona, ...]:
    payload = _read_json(path)
    if payload.get("schema_version") != "0.1.0" or not isinstance(payload.get("personas"), list):
        raise DataValidationError("Unsupported or malformed personas benchmark")
    personas: list[Persona] = []
    seen: set[str] = set()
    for value in payload["personas"]:
        persona_id = str(value["id"])
        if persona_id in seen:
            raise DataValidationError(f"Duplicate persona ID: {persona_id}")
        seen.add(persona_id)
        preferences = [
            _synthetic_preference(persona_id, Scope(), item)
            for item in value.get("global_preferences", [])
        ]
        for domain, records in value.get("domain_preferences", {}).items():
            preferences.extend(
                _synthetic_preference(persona_id, Scope(domain=str(domain)), item)
                for item in records
            )
        personas.append(
            Persona(
                id=persona_id,
                label=str(value["label"]),
                description=str(value.get("description", "")),
                static_profile=str(value.get("static_profile", "")),
                preferences=tuple(preferences),
                feedback_history=tuple(value.get("feedback_history", [])),
            )
        )
    return tuple(personas)


def load_tasks(path: Path) -> tuple[Task, ...]:
    payload = _read_json(path)
    if payload.get("schema_version") != "0.1.0" or not isinstance(payload.get("tasks"), list):
        raise DataValidationError("Unsupported or malformed tasks benchmark")
    tasks: list[Task] = []
    seen: set[str] = set()
    for value in payload["tasks"]:
        task_id = str(value["id"])
        if task_id in seen:
            raise DataValidationError(f"Duplicate task ID: {task_id}")
        seen.add(task_id)
        tasks.append(
            Task(
                id=task_id,
                split=str(value["split"]),
                template_family=str(value["template_family"]),
                domain=str(value["domain"]),
                subdomain=value.get("subdomain"),
                task_type=str(value["task_type"]),
                difficulty=str(value["difficulty"]),
                prompt=str(value["prompt"]),
                reference_points=tuple(value.get("reference_points", [])),
                automatic_checks=dict(value.get("automatic_checks", {})),
                human_emphasis=tuple(value.get("human_emphasis", [])),
            )
        )
    return tuple(tasks)
