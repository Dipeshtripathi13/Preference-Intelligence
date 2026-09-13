"""Summarize run integrity and diagnostic metrics without causal claims."""

from __future__ import annotations

import argparse
import json
import statistics
from collections import defaultdict
from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import Any


def _mean(values: Iterable[float | int | None]) -> float | None:
    observed = [float(value) for value in values if value is not None]
    return round(statistics.fmean(observed), 6) if observed else None


def summarize(path: Path) -> dict[str, Any]:
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    total = 0
    failed = 0
    with path.open(encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSONL at line {line_number}: {exc}") from exc
            total += 1
            failed += int(record.get("error") is not None)
            groups[(record["model_provider"], record["personalization_condition"])].append(record)
    rows = []
    for (provider, condition), records in sorted(groups.items()):
        rows.append(
            {
                "model_provider": provider,
                "personalization_condition": condition,
                "records": len(records),
                "failures": sum(record.get("error") is not None for record in records),
                "mean_latency_ms": _mean(record.get("latency_ms") for record in records),
                "mean_approximate_input_tokens": _mean(
                    record.get("token_counts", {}).get("approximate_input") for record in records
                ),
                "mean_automatic_pass_rate": _mean(
                    (record.get("evaluation_scores") or {}).get("automatic_pass_rate")
                    for record in records
                ),
            }
        )
    return {
        "status": "descriptive_diagnostics_only",
        "records": total,
        "failures": failed,
        "groups": rows,
    }


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("jsonl", type=Path)
    args = parser.parse_args(argv)
    try:
        result = summarize(args.jsonl)
    except (OSError, ValueError) as exc:
        parser.exit(2, f"error: {exc}\n")
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
