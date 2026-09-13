"""Condition-controlled, provider-independent experiment runner."""

from __future__ import annotations

import platform
import random
import subprocess
import time
import uuid
from collections.abc import Iterable
from dataclasses import dataclass, replace
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol, TypeVar

from .. import __version__
from ..data import file_sha256, load_personas, load_profile_preferences, load_tasks
from ..evaluation.metrics import approximate_token_count, evaluate_response
from ..models import Condition, GenerationRequest
from ..personalization.conditions import compile_personalization
from ..providers import Provider, ProviderError
from .logging import JsonlWriter, write_json


@dataclass(frozen=True)
class ExperimentConfig:
    experiment_id: str
    requested_provider: str
    requested_model: str
    conditions: tuple[Condition, ...]
    personas_path: Path
    tasks_path: Path
    output_path: Path
    seed: int = 20260912
    temperature: float = 0.0
    max_output_tokens: int = 800
    reasoning_effort: str | None = None
    compiler_variant: str = "compact_v2"
    split: str | None = None
    persona_ids: tuple[str, ...] = ()
    task_ids: tuple[str, ...] = ()
    limit: int | None = None
    minimum_confidence: float = 0.6
    history_top_k: int = 4
    replicates: int = 1
    shuffle_cells: bool = False
    dry_run: bool = False
    fail_fast: bool = False
    profile_path: Path | None = None


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _git_commit(start: Path) -> str | None:
    try:
        value = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=start,
            check=True,
            capture_output=True,
            text=True,
            timeout=5,
        ).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return None
    return value or None


class _HasId(Protocol):
    @property
    def id(self) -> str: ...


T = TypeVar("T", bound=_HasId)


def _select(values: Iterable[T], ids: tuple[str, ...], split: str | None = None) -> tuple[T, ...]:
    selected = []
    requested = set(ids)
    for value in values:
        identifier = value.id
        if requested and identifier not in requested:
            continue
        if split and getattr(value, "split", None) != split:
            continue
        selected.append(value)
    found = {value.id for value in selected}
    missing = requested - found
    if missing:
        raise ValueError(f"Unknown or split-excluded IDs: {', '.join(sorted(missing))}")
    return tuple(selected)


def _manifest(
    config: ExperimentConfig, actual_provider: str, research_root: Path
) -> dict[str, Any]:
    benchmark_hashes = {
        "personas": file_sha256(config.personas_path),
        "tasks": file_sha256(config.tasks_path),
    }
    if config.profile_path:
        benchmark_hashes["portable_profile"] = file_sha256(config.profile_path)
    return {
        "manifest_version": "0.2.0",
        "created_at": _utc_now(),
        "experiment_id": config.experiment_id,
        "runner_version": __version__,
        "git_commit": _git_commit(research_root),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "requested_provider": config.requested_provider,
        "actual_provider": actual_provider,
        "requested_model": config.requested_model,
        "conditions": [condition.value for condition in config.conditions],
        "temperature": config.temperature,
        "max_output_tokens": config.max_output_tokens,
        "reasoning_effort": config.reasoning_effort,
        "compiler_variant": config.compiler_variant,
        "random_seed": config.seed,
        "split": config.split,
        "persona_ids": list(config.persona_ids),
        "task_ids": list(config.task_ids),
        "limit": config.limit,
        "minimum_confidence": config.minimum_confidence,
        "history_top_k": config.history_top_k,
        "replicates": config.replicates,
        "shuffle_cells": config.shuffle_cells,
        "dry_run": config.dry_run,
        "input_sha256": benchmark_hashes,
        "output_jsonl": str(config.output_path.resolve()),
        "secrets_logged": False,
    }


def run_experiment(
    config: ExperimentConfig,
    provider: Provider,
) -> dict[str, int]:
    """Run selected persona/task/condition cells and return execution counts."""

    manifest_path = config.output_path.with_suffix(".manifest.json")
    existing = [path for path in (config.output_path, manifest_path) if path.exists()]
    if existing:
        joined = ", ".join(str(path) for path in existing)
        raise FileExistsError(
            f"Refusing to mix or overwrite an existing run: {joined}. Choose a new --output."
        )

    personas = _select(load_personas(config.personas_path), config.persona_ids)
    tasks = _select(load_tasks(config.tasks_path), config.task_ids, config.split)
    if config.profile_path:
        imported_preferences = load_profile_preferences(config.profile_path)
        personas = tuple(replace(persona, preferences=imported_preferences) for persona in personas)
    if not personas or not tasks or not config.conditions:
        raise ValueError("The selected experiment has no persona/task/condition cells")

    research_root = config.personas_path.resolve().parents[1]
    write_json(manifest_path, _manifest(config, provider.name, research_root))
    writer = JsonlWriter(config.output_path)
    counts = {"assigned": 0, "completed": 0, "failed": 0}

    cells = [
        (replicate, persona, task, condition)
        for replicate in range(config.replicates)
        for persona in personas
        for task in tasks
        for condition in config.conditions
    ]
    if config.shuffle_cells:
        random.Random(config.seed).shuffle(cells)

    for index, (replicate, persona, task, condition) in enumerate(cells):
        if config.limit is not None and index >= config.limit:
            break
        counts["assigned"] += 1
        cell_seed = config.seed + index
        bundle = compile_personalization(
            condition,
            persona,
            task,
            minimum_confidence=config.minimum_confidence,
            history_top_k=config.history_top_k,
            compiler_variant=config.compiler_variant,
        )
        generation_request = GenerationRequest(
            model=config.requested_model,
            system_prompt=bundle.system_prompt,
            user_prompt=task.prompt,
            temperature=config.temperature,
            max_output_tokens=config.max_output_tokens,
            seed=cell_seed,
            reasoning_effort=config.reasoning_effort,
        )
        timestamp = _utc_now()
        started = time.perf_counter()
        error: str | None = None
        result = None
        try:
            result = provider.generate(generation_request)
            counts["completed"] += 1
        except (ProviderError, OSError, ValueError) as exc:
            error = f"{type(exc).__name__}: {exc}"
            counts["failed"] += 1
        latency_ms = round((time.perf_counter() - started) * 1000, 3)

        response = result.text if result else None
        provider_input = result.input_tokens if result else None
        provider_output = result.output_tokens if result else None
        approximate_input = approximate_token_count(
            f"{generation_request.system_prompt}\n{generation_request.user_prompt}"
        )
        approximate_output = (
            approximate_token_count(response or "") if response is not None else None
        )
        record: dict[str, Any] = {
            "record_version": "0.2.0",
            "experiment_id": config.experiment_id,
            "cell_id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{config.experiment_id}:{index}")),
            "timestamp": timestamp,
            "dry_run": config.dry_run,
            "model_provider": provider.name,
            "requested_provider": config.requested_provider,
            "model_name": config.requested_model,
            "returned_model": result.returned_model if result else None,
            "model_version": result.model_version if result else None,
            "temperature": config.temperature,
            "max_output_tokens": config.max_output_tokens,
            "reasoning_effort": config.reasoning_effort,
            "compiler_variant": config.compiler_variant,
            "random_seed": cell_seed,
            "replicate": replicate,
            "persona_id": persona.id,
            "task_id": task.id,
            "task_domain": task.domain,
            "task_subdomain": task.subdomain,
            "task_type": task.task_type,
            "task_split": task.split,
            "system_prompt": generation_request.system_prompt,
            "user_prompt": generation_request.user_prompt,
            "personalization_condition": condition.value,
            "preferences_selected": [item.to_log_dict() for item in bundle.selected_preferences],
            "retrieved_event_ids": list(bundle.retrieved_event_ids),
            "compiled_preference_context": bundle.compiled_context,
            "token_counts": {
                "provider_input": provider_input,
                "provider_output": provider_output,
                "approximate_input": approximate_input,
                "approximate_output": approximate_output,
                "approximation_method": "ceil_unicode_characters_divided_by_4",
            },
            "latency_ms": latency_ms,
            "response": response,
            "evaluation_scores": evaluate_response(response, task.automatic_checks)
            if response is not None
            else None,
            "finish_reason": result.finish_reason if result else None,
            "provider_metadata": result.raw_metadata if result else {},
            "error": error,
        }
        writer.append(record)
        if error and config.fail_fast:
            raise ProviderError(error)
    return counts
