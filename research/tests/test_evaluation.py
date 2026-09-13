from __future__ import annotations

import sys
import unittest
from pathlib import Path

RESEARCH_ROOT = Path(__file__).resolve().parents[1]
SRC = RESEARCH_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from preference_intelligence_research.evaluation.metrics import (  # noqa: E402
    approximate_token_count,
    evaluate_response,
)


class EvaluationTests(unittest.TestCase):
    def test_applicable_checks_and_nulls_are_distinct(self) -> None:
        result = evaluate_response(
            '{"goal":"read","first_step":"open book","risk":"fatigue"}',
            {"requires_json": True, "max_words": 20},
        )
        self.assertTrue(result["json_pass"])
        self.assertTrue(result["max_words_pass"])
        self.assertIsNone(result["code_block_pass"])
        self.assertEqual(result["automatic_pass_rate"], 1.0)

    def test_forbidden_and_expected_markers(self) -> None:
        result = evaluate_response(
            "Bond price tends to move opposite its yield.",
            {"expected_any": ["yield"], "forbidden": ["you should buy"]},
        )
        self.assertTrue(result["expected_any_pass"])
        self.assertTrue(result["forbidden_pass"])

    def test_token_count_is_explicit_heuristic(self) -> None:
        self.assertEqual(approximate_token_count(""), 0)
        self.assertEqual(approximate_token_count("abcde"), 2)


if __name__ == "__main__":
    unittest.main()
