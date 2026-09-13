"""Reproducible descriptive analysis for the 2026-09-13 local-model pilot.

The concept rubric is a post-hoc diagnostic derived from the benchmark's existing
reference points. It is not a factuality metric or a substitute for blinded human
evaluation.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import re
import uuid
from collections import defaultdict
from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import Any

TARGET_CONDITION = "domain_dynamic"

# Each expression corresponds to one pre-existing factual reference point or a
# deliberately narrow lexical proxy for it. These checks were defined before the
# condition labels were analyzed, but after generation, so all results are exploratory.
REFERENCE_CONCEPTS: dict[str, tuple[tuple[str, str], ...]] = {
    "se_java_virtual_threads_01": (
        ("blocking_or_io_scalability", r"\b(blocking|i/o|concurren|throughput)\b"),
        ("cpu_bound_limitation", r"\bcpu[- ]?bound\b|not.{0,25}\bfaster\b|parallelism"),
        (
            "resource_or_pinning_limit",
            r"\b(pinning|synchronized|native|downstream|connection pool|resource)\b",
        ),
    ),
    "se_kafka_rebalance_01": (
        (
            "partition_reassignment",
            r"\bpartition\w*\b.{0,80}\b(assign|rebalanc)"
            r"|\b(assign|rebalanc)\w*\b.{0,80}\bpartition",
        ),
        ("membership_trigger", r"\b(join|leave|failure|membership|subscription)\w*\b"),
        ("cooperative_rebalancing", r"\b(cooperative|incremental)\b"),
        (
            "stability_mitigation",
            r"\b(static membership|group\.instance\.id|session timeout|stable)\b",
        ),
    ),
    "finance_duration_01": (
        (
            "inverse_price_yield",
            r"\binvers\w*\b"
            r"|\b(rate|yield)s? rise.{0,80}\b(price|value).{0,20}\b(fall|drop|decreas)"
            r"|\b(price|value).{0,20}\b(fall|drop|decreas).{0,80}\b(rate|yield)s? rise",
        ),
        (
            "percentage_sensitivity",
            r"\bduration\b.{0,100}(percent|%|sensitiv)"
            r"|\b(percent|%|sensitiv)\w*\b.{0,100}\bduration\b",
        ),
        ("approximation_limit", r"\b(convexity|approximation|small (rate|yield) change)\b"),
    ),
    "finance_diversification_01": (
        ("correlation", r"\bcorrelat\w*\b"),
        (
            "idiosyncratic_risk",
            r"\b(idiosyncratic|unsystematic|company-specific|asset-specific|specific risk)\b",
        ),
        (
            "market_risk_remains",
            r"\b(systematic|market-wide|cannot eliminate|can't eliminate"
            r"|does not eliminate|doesn't eliminate)\b",
        ),
        ("cost_or_hidden_correlation", r"\b(cost|fee|hidden correlation)\w*\b"),
    ),
}

METRICS = (
    "reference_coverage",
    "concise_proxy",
    "word_count",
    "provider_input_tokens",
    "provider_output_tokens",
    "latency_ms",
    "automatic_pass_rate",
    "length_termination",
)


def _read_jsonl(paths: Iterable[Path]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in paths:
        with path.open(encoding="utf-8") as stream:
            for line_number, line in enumerate(stream, 1):
                if not line.strip():
                    continue
                value = json.loads(line)
                if not isinstance(value, dict):
                    raise ValueError(f"{path}:{line_number} is not a JSON object")
                records.append(value)
    return records


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def _mean(values: Iterable[float | int]) -> float:
    observed = [float(value) for value in values]
    return sum(observed) / len(observed) if observed else 0.0


def reference_coverage(task_id: str, response: str) -> tuple[float, list[str]]:
    checks = REFERENCE_CONCEPTS.get(task_id)
    if not checks:
        raise ValueError(f"No exploratory concept rubric for task {task_id}")
    matched = [name for name, pattern in checks if re.search(pattern, response, re.I | re.S)]
    return len(matched) / len(checks), matched


def enrich(record: dict[str, Any]) -> dict[str, Any]:
    if record.get("dry_run") is not False:
        raise ValueError("Local pilot analysis accepts only real, non-dry-run records")
    response = record.get("response")
    if not isinstance(response, str) or not response.strip():
        raise ValueError(f"Missing response for cell {record.get('cell_id')}")
    score, matched = reference_coverage(str(record["task_id"]), response)
    evaluation = record.get("evaluation_scores") or {}
    tokens = record.get("token_counts") or {}
    enriched = dict(record)
    enriched["analysis"] = {
        "reference_coverage": score,
        "reference_concepts_matched": matched,
        "concise_proxy": float(int(evaluation.get("word_count", 0)) <= 180),
        "word_count": float(evaluation.get("word_count", 0)),
        "provider_input_tokens": float(tokens.get("provider_input") or 0),
        "provider_output_tokens": float(tokens.get("provider_output") or 0),
        "latency_ms": float(record.get("latency_ms") or 0),
        "automatic_pass_rate": float(evaluation.get("automatic_pass_rate") or 0),
        "length_termination": float(str(record.get("finish_reason", "")).lower() == "length"),
    }
    return enriched


def _summary_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        groups[(str(record["model_name"]), str(record["personalization_condition"]))].append(record)
    rows: list[dict[str, Any]] = []
    for (model, condition), group in sorted(groups.items()):
        row: dict[str, Any] = {"model": model, "condition": condition, "n": len(group)}
        for metric in METRICS:
            row[metric] = round(_mean(item["analysis"][metric] for item in group), 6)
        rows.append(row)
    return rows


def _paired_differences(
    records: list[dict[str, Any]], model: str | None, comparator: str, metric: str
) -> list[tuple[str, float]]:
    selected = [record for record in records if model is None or record["model_name"] == model]
    cells: dict[tuple[str, str, int], dict[str, dict[str, Any]]] = defaultdict(dict)
    for record in selected:
        key = (str(record["model_name"]), str(record["task_id"]), int(record["replicate"]))
        cells[key][str(record["personalization_condition"])] = record
    differences: list[tuple[str, float]] = []
    for (cell_model, task_id, _replicate), conditions in cells.items():
        if TARGET_CONDITION not in conditions or comparator not in conditions:
            continue
        difference = (
            float(conditions[TARGET_CONDITION]["analysis"][metric])
            - float(conditions[comparator]["analysis"][metric])
        )
        differences.append((f"{cell_model}:{task_id}", difference))
    return differences


def _cluster_interval(
    differences: list[tuple[str, float]], seed: int, draws: int = 5000
) -> tuple[float, float]:
    clusters: dict[str, list[float]] = defaultdict(list)
    for cluster, value in differences:
        clusters[cluster].append(value)
    keys = sorted(clusters)
    if not keys:
        return 0.0, 0.0
    generator = random.Random(seed)
    samples: list[float] = []
    for _ in range(draws):
        sampled = [generator.choice(keys) for _ in keys]
        values = [value for key in sampled for value in clusters[key]]
        samples.append(_mean(values))
    samples.sort()
    return samples[int(0.025 * draws)], samples[min(draws - 1, int(0.975 * draws))]


def _contrast_rows(records: list[dict[str, Any]], seed: int) -> list[dict[str, Any]]:
    models = sorted({str(record["model_name"]) for record in records})
    comparators = sorted(
        {
            str(record["personalization_condition"])
            for record in records
            if record["personalization_condition"] != TARGET_CONDITION
        }
    )
    rows: list[dict[str, Any]] = []
    for model_label, model in [("pooled", None), *((item, item) for item in models)]:
        for comparator in comparators:
            for metric_index, metric in enumerate(METRICS):
                differences = _paired_differences(records, model, comparator, metric)
                low, high = _cluster_interval(
                    differences,
                    seed + metric_index + sum(ord(char) for char in model_label + comparator),
                )
                rows.append(
                    {
                        "model": model_label,
                        "target": TARGET_CONDITION,
                        "comparator": comparator,
                        "metric": metric,
                        "n_pairs": len(differences),
                        "n_task_clusters": len({cluster for cluster, _ in differences}),
                        "mean_paired_difference": round(
                            _mean(value for _, value in differences), 6
                        ),
                        "exploratory_cluster_bootstrap_low": round(low, 6),
                        "exploratory_cluster_bootstrap_high": round(high, 6),
                    }
                )
    return rows


def _preferences_for_task(persona: dict[str, Any], domain: str) -> list[dict[str, Any]]:
    preferences = [
        {"dimension": item["dimension"], "value": item["value"], "scope": "global"}
        for item in persona.get("global_preferences", [])
    ]
    preferences.extend(
        {"dimension": item["dimension"], "value": item["value"], "scope": domain}
        for item in persona.get("domain_preferences", {}).get(domain, [])
    )
    return preferences


def _blinded_pairs(
    records: list[dict[str, Any]], benchmark_dir: Path, seed: int
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    tasks_payload = json.loads((benchmark_dir / "tasks.json").read_text(encoding="utf-8"))
    personas_payload = json.loads((benchmark_dir / "personas.json").read_text(encoding="utf-8"))
    tasks = {item["id"]: item for item in tasks_payload["tasks"]}
    persona = next(
        item
        for item in personas_payload["personas"]
        if item["id"] == "p01_engineer_finance_novice"
    )
    cells: dict[tuple[str, str, int], dict[str, dict[str, Any]]] = defaultdict(dict)
    for record in records:
        key = (str(record["model_name"]), str(record["task_id"]), int(record["replicate"]))
        cells[key][str(record["personalization_condition"])] = record

    generator = random.Random(seed)
    blinded: list[dict[str, Any]] = []
    keys: list[dict[str, Any]] = []
    for (model, task_id, replicate), conditions in sorted(cells.items()):
        target = conditions[TARGET_CONDITION]
        task = tasks[task_id]
        comparators = sorted(set(conditions) - {TARGET_CONDITION})
        for comparator in comparators:
            other = conditions[comparator]
            pair_id = str(
                uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f"local-pilot:{model}:{task_id}:{replicate}:{comparator}",
                )
            )
            left_is_target = generator.random() < 0.5
            left, right = (target, other) if left_is_target else (other, target)
            blinded.append(
                {
                    "pair_id": pair_id,
                    "task_id": task_id,
                    "task_domain": task["domain"],
                    "user_prompt": task["prompt"],
                    "evaluation_preferences": _preferences_for_task(persona, task["domain"]),
                    "response_a": left["response"],
                    "response_b": right["response"],
                    "overall_preference": None,
                    "usefulness_a_1_to_7": None,
                    "usefulness_b_1_to_7": None,
                    "depth_fit_a_1_to_7": None,
                    "depth_fit_b_1_to_7": None,
                    "notes": None,
                }
            )
            keys.append(
                {
                    "pair_id": pair_id,
                    "model": model,
                    "task_id": task_id,
                    "replicate": replicate,
                    "response_a_condition": str(left["personalization_condition"]),
                    "response_b_condition": str(right["personalization_condition"]),
                }
            )
    generator.shuffle(blinded)
    return blinded, keys


def _write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        raise ValueError(f"Cannot write empty CSV to {path}")
    with path.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def _write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def _report(
    summary_rows: list[dict[str, Any]],
    contrast_rows: list[dict[str, Any]],
    records: list[dict[str, Any]],
) -> str:
    conditions = sorted({str(record["personalization_condition"]) for record in records})
    variants = sorted({str(record.get("compiler_variant") or "verbose_v1") for record in records})
    models = sorted({str(record["model_name"]) for record in records})
    tasks = {str(record["task_id"]) for record in records}
    replicates = {int(record["replicate"]) for record in records}
    selected_contrasts = [
        row
        for row in contrast_rows
        if row["model"] == "pooled"
        and row["comparator"] in {"no_personalization", "history_rag"}
        and row["metric"]
        in {"reference_coverage", "word_count", "provider_input_tokens", "latency_ms"}
    ]
    lines = [
        "# Real local-model pilot results",
        "",
        "Status: **measured exploratory pilot**, not confirmatory evidence of subjective benefit.",
        "",
        "## Design",
        "",
        f"{len(models)} local model families ({', '.join(models)}) generated responses for "
        f"one controlled multidomain persona, {len(tasks)} tasks, {len(conditions)} conditions, "
        f"and {len(replicates)} stochastic replicate(s) per cell. Cell order was deterministically "
        "shuffled with a recorded seed. Temperature was 0.3, maximum output was 260 tokens, "
        "and reasoning was disabled for comparable visible-output budgets. "
        f"This dataset contains {len(records)} real generations. Compiler variant(s): "
        f"{', '.join(variants)}.",
        "",
        "The concept-coverage rubric is a post-hoc lexical diagnostic derived from the "
        "benchmark's pre-existing reference points. It is not a factuality score. Confidence "
        "intervals are exploratory cluster bootstraps over model-task clusters.",
        "",
        "## Descriptive results",
        "",
        "| Model | Condition | n | Reference coverage | Words | Concise proxy | "
        "Input tokens | Output tokens | Latency ms | Length-stop rate |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in summary_rows:
        lines.append(
            f"| {row['model']} | {row['condition']} | {row['n']} | "
            f"{row['reference_coverage']:.3f} | {row['word_count']:.1f} | "
            f"{row['concise_proxy']:.3f} | {row['provider_input_tokens']:.1f} | "
            f"{row['provider_output_tokens']:.1f} | {row['latency_ms']:.1f} | "
            f"{row['length_termination']:.3f} |"
        )
    lines.extend(
        [
            "",
            "## Paired domain-conditioned contrasts",
            "",
            "Positive differences mean the domain-conditioned condition was higher; for words, "
            "tokens, and latency, lower values may be preferable depending on the estimand.",
            "",
            "| Comparator | Metric | Pairs | Mean difference | Exploratory 95% interval |",
            "|---|---:|---:|---:|---:|",
        ]
    )
    for row in selected_contrasts:
        lines.append(
            f"| {row['comparator']} | {row['metric']} | {row['n_pairs']} | "
            f"{row['mean_paired_difference']:.3f} | "
            f"[{row['exploratory_cluster_bootstrap_low']:.3f}, "
            f"{row['exploratory_cluster_bootstrap_high']:.3f}] |"
        )
    lines.extend(
        [
            "",
            "## Interpretation boundary",
            "",
            "These measurements establish that one serialized domain-conditioned profile can be "
            "compiled and used by two heterogeneous local model families, with complete run "
            "logging and no transport failures. They do not establish that users prefer the "
            "personalized responses. The sample contains only one synthetic persona and four "
            "English tasks; model capabilities differ substantially; lexical coverage can miss "
            "correct paraphrases and reward keyword inclusion; output truncation may affect all "
            "metrics; and the analysis was not preregistered before generation.",
            "",
            "The condition-blinded annotation file is ready for human scoring. Until those ratings "
            "exist, the main research hypothesis remains open.",
            "",
        ]
    )
    return "\n".join(lines)


def analyze(
    inputs: Sequence[Path], output_dir: Path, benchmark_dir: Path, seed: int
) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    records = [enrich(record) for record in _read_jsonl(inputs)]
    models = {str(record["model_name"]) for record in records}
    tasks = {str(record["task_id"]) for record in records}
    conditions = {str(record["personalization_condition"]) for record in records}
    replicates = {int(record["replicate"]) for record in records}
    if TARGET_CONDITION not in conditions:
        raise ValueError(f"Pilot must contain target condition {TARGET_CONDITION}")
    expected = len(models) * len(tasks) * len(conditions) * len(replicates)
    if len(records) != expected:
        raise ValueError(f"Expected {expected} balanced records, found {len(records)}")
    cell_keys = {
        (
            str(record["model_name"]),
            str(record["task_id"]),
            int(record["replicate"]),
            str(record["personalization_condition"]),
        )
        for record in records
    }
    if len(cell_keys) != len(records):
        raise ValueError("Duplicate model/task/replicate/condition cell")
    if any(record.get("error") is not None for record in records):
        raise ValueError("Pilot contains failed cells; use the failure-aware analysis path")

    summary_rows = _summary_rows(records)
    contrast_rows = _contrast_rows(records, seed)
    blinded, key = _blinded_pairs(records, benchmark_dir, seed + 1)
    _write_csv(output_dir / "descriptive_summary.csv", summary_rows)
    _write_csv(output_dir / "paired_contrasts.csv", contrast_rows)
    _write_jsonl(output_dir / "blinded_annotation_pairs.jsonl", blinded)
    (output_dir / "blinding_key.json").write_text(
        json.dumps(key, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (output_dir / "pilot_report.md").write_text(
        _report(summary_rows, contrast_rows, records), encoding="utf-8"
    )
    result = {
        "analysis_version": "0.2.0",
        "status": "exploratory_real_local_model_pilot",
        "random_seed": seed,
        "records": len(records),
        "models": sorted(models),
        "tasks": sorted(tasks),
        "conditions": sorted(conditions),
        "replicates": sorted(replicates),
        "failures": 0,
        "input_files": [
            {"path": str(path), "sha256": _sha256(path)} for path in inputs
        ],
        "post_hoc_metrics": True,
        "human_ratings_collected": False,
        "blinded_pairs": len(blinded),
    }
    (output_dir / "analysis_manifest.json").write_text(
        json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return result


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", action="append", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--benchmark-dir", type=Path, default=Path("benchmark"))
    parser.add_argument("--seed", type=int, default=20260913)
    args = parser.parse_args(argv)
    print(
        json.dumps(
            analyze(args.input, args.output_dir, args.benchmark_dir, args.seed),
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
