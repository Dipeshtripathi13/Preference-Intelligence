"""Transparent response checks for regression testing.

None of these surface checks estimates subjective quality or semantic correctness.
"""

from __future__ import annotations

import json
import math
import re
from typing import Any


def approximate_token_count(text: str) -> int:
    """Return an explicitly approximate, provider-agnostic character heuristic."""

    return 0 if not text else math.ceil(len(text) / 4)


def _has_steps(text: str) -> bool:
    enumerated = re.findall(r"(?m)^\s*(?:\d+[.)]|step\s+\d+\s*[:.)-])\s+", text, re.I)
    return len(enumerated) >= 2


def _is_json(text: str) -> bool:
    try:
        json.loads(text.strip())
    except (json.JSONDecodeError, TypeError):
        return False
    return True


def evaluate_response(text: str, checks: dict[str, Any]) -> dict[str, Any]:
    """Evaluate applicable deterministic checks and retain nulls for inapplicability."""

    words = re.findall(r"\S+", text)
    lower = text.lower()
    results: dict[str, Any] = {
        "metric_status": "automatic_diagnostic_not_subjective_quality",
        "word_count": len(words),
        "expected_any_pass": None,
        "forbidden_pass": None,
        "min_words_pass": None,
        "max_words_pass": None,
        "code_block_pass": None,
        "json_pass": None,
        "steps_pass": None,
    }
    expected = checks.get("expected_any")
    if expected:
        results["expected_any_pass"] = any(str(marker).lower() in lower for marker in expected)
    forbidden = checks.get("forbidden")
    if forbidden:
        results["forbidden_pass"] = all(str(marker).lower() not in lower for marker in forbidden)
    if "min_words" in checks:
        results["min_words_pass"] = len(words) >= int(checks["min_words"])
    if "max_words" in checks:
        results["max_words_pass"] = len(words) <= int(checks["max_words"])
    if checks.get("requires_code_block"):
        results["code_block_pass"] = bool(re.search(r"```[^`]*```", text, re.S))
    if checks.get("requires_json"):
        results["json_pass"] = _is_json(text)
    if checks.get("requires_steps"):
        results["steps_pass"] = _has_steps(text)

    applicable = [
        value
        for key, value in results.items()
        if key.endswith("_pass") and isinstance(value, bool)
    ]
    results["applicable_check_count"] = len(applicable)
    results["automatic_pass_rate"] = (
        sum(int(value) for value in applicable) / len(applicable) if applicable else None
    )
    return results
