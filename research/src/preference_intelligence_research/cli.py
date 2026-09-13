"""Command-line interface for reproducible benchmark generation."""

from __future__ import annotations

import argparse
import json
import uuid
from collections.abc import Sequence
from datetime import datetime, timezone
from pathlib import Path

from .experiments.runner import ExperimentConfig, run_experiment
from .models import Condition
from .providers import ProviderConfig, ProviderError, create_provider


def _default_research_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _conditions(values: list[str]) -> tuple[Condition, ...]:
    if not values or "all" in values:
        return tuple(Condition)
    result = tuple(Condition(value) for value in values)
    return tuple(dict.fromkeys(result))


def build_parser() -> argparse.ArgumentParser:
    root = _default_research_root()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    parser = argparse.ArgumentParser(
        description=(
            "Run controlled personalization conditions. Automatic metrics are diagnostics, "
            "not evidence of subjective quality."
        )
    )
    parser.add_argument(
        "--provider",
        choices=("mock", "openai", "anthropic", "gemini", "local"),
        default="mock",
    )
    parser.add_argument(
        "--model", help="Exact provider model identifier; required outside mock mode"
    )
    parser.add_argument(
        "--condition",
        action="append",
        choices=("all", *(condition.value for condition in Condition)),
        default=[],
        help="Repeat to run multiple arms; default: all conditions",
    )
    parser.add_argument("--persona", action="append", default=[], help="Persona ID; repeatable")
    parser.add_argument("--task", action="append", default=[], help="Task ID; repeatable")
    parser.add_argument("--split", choices=("development", "locked_test"))
    parser.add_argument("--benchmark-dir", type=Path, default=root / "benchmark")
    parser.add_argument(
        "--profile",
        type=Path,
        help="Optional canonical Universal Preference Profile applied to each selected persona",
    )
    parser.add_argument("--output", type=Path, default=root / "runs" / f"run-{timestamp}.jsonl")
    parser.add_argument("--experiment-id", default=f"exp-{uuid.uuid4()}")
    parser.add_argument("--seed", type=int, default=20260912)
    parser.add_argument("--temperature", type=float, default=0.0)
    parser.add_argument("--max-output-tokens", type=int, default=800)
    parser.add_argument(
        "--reasoning-effort",
        choices=("none", "low", "medium", "high", "max"),
        help="Optional OpenAI-compatible reasoning control; supported for openai/local adapters",
    )
    parser.add_argument(
        "--compiler-variant",
        choices=("compact_v2", "verbose_v1"),
        default="compact_v2",
        help="Structured-profile prompt renderer; verbose_v1 reproduces the first local pilot",
    )
    parser.add_argument("--minimum-confidence", type=float, default=0.6)
    parser.add_argument("--history-top-k", type=int, default=4)
    parser.add_argument("--replicates", type=int, default=1)
    parser.add_argument(
        "--shuffle-cells",
        action="store_true",
        help="Deterministically randomize generation order using --seed",
    )
    parser.add_argument("--limit", type=int, help="Maximum cells, useful for connectivity pilots")
    parser.add_argument("--timeout", type=float, default=120.0)
    parser.add_argument(
        "--base-url", help="Provider endpoint override; required for local if env is unset"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Force deterministic mock; never call network"
    )
    parser.add_argument("--fail-fast", action="store_true")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.provider != "mock" and not args.dry_run and not args.model:
        parser.error("--model is required for a non-mock provider")
    if args.limit is not None and args.limit <= 0:
        parser.error("--limit must be positive")
    if args.replicates <= 0:
        parser.error("--replicates must be positive")
    if not 0 <= args.minimum_confidence <= 1:
        parser.error("--minimum-confidence must be within [0, 1]")
    if args.max_output_tokens <= 0 or args.timeout <= 0:
        parser.error("--max-output-tokens and --timeout must be positive")
    if args.reasoning_effort and args.provider not in {"openai", "local"}:
        parser.error("--reasoning-effort is supported only by openai and local adapters")
    model = args.model or "deterministic-mock-model"
    config = ExperimentConfig(
        experiment_id=args.experiment_id,
        requested_provider=args.provider,
        requested_model=model,
        conditions=_conditions(args.condition),
        personas_path=args.benchmark_dir / "personas.json",
        tasks_path=args.benchmark_dir / "tasks.json",
        output_path=args.output,
        seed=args.seed,
        temperature=args.temperature,
        max_output_tokens=args.max_output_tokens,
        reasoning_effort=args.reasoning_effort,
        compiler_variant=args.compiler_variant,
        split=args.split,
        persona_ids=tuple(args.persona),
        task_ids=tuple(args.task),
        limit=args.limit,
        minimum_confidence=args.minimum_confidence,
        history_top_k=args.history_top_k,
        replicates=args.replicates,
        shuffle_cells=args.shuffle_cells,
        dry_run=args.dry_run,
        fail_fast=args.fail_fast,
        profile_path=args.profile,
    )
    provider = create_provider(
        ProviderConfig(
            name=args.provider,
            model=model,
            timeout_seconds=args.timeout,
            base_url=args.base_url,
        ),
        dry_run=args.dry_run,
    )
    try:
        counts = run_experiment(config, provider)
    except (OSError, ValueError, ProviderError) as exc:
        parser.exit(2, f"error: {exc}\n")
    print(
        json.dumps(
            {
                "status": "completed" if counts["failed"] == 0 else "completed_with_failures",
                "output": str(args.output),
                "manifest": str(args.output.with_suffix(".manifest.json")),
                **counts,
            },
            sort_keys=True,
        )
    )
    return 0 if counts["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
