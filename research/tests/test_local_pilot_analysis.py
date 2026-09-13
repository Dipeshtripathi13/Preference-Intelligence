from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

RESEARCH_ROOT = Path(__file__).resolve().parents[1]
SRC = RESEARCH_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from preference_intelligence_research.analysis.local_pilot import (  # noqa: E402
    analyze,
    reference_coverage,
)


class LocalPilotAnalysisTests(unittest.TestCase):
    def test_reference_coverage_uses_preexisting_task_concepts(self) -> None:
        score, matched = reference_coverage(
            "finance_duration_01",
            "Duration approximates percentage sensitivity: when rates rise, prices fall. "
            "Convexity improves the approximation for larger yield changes.",
        )
        self.assertEqual(score, 1.0)
        self.assertEqual(len(matched), 3)

    def test_balanced_real_records_produce_blinded_pair_and_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            raw = root / "raw.jsonl"
            output = root / "analysis"
            records = []
            for condition in ("no_personalization", "domain_dynamic"):
                records.append(
                    {
                        "dry_run": False,
                        "model_name": "fixture-model",
                        "task_id": "finance_duration_01",
                        "replicate": 0,
                        "personalization_condition": condition,
                        "response": "When yields rise, bond prices fall; duration approximates "
                        "the percentage sensitivity and convexity refines it.",
                        "evaluation_scores": {
                            "word_count": 15,
                            "automatic_pass_rate": 1.0,
                        },
                        "token_counts": {"provider_input": 20, "provider_output": 25},
                        "latency_ms": 10,
                        "finish_reason": "stop",
                        "error": None,
                    }
                )
            raw.write_text(
                "".join(json.dumps(record) + "\n" for record in records), encoding="utf-8"
            )

            manifest = analyze([raw], output, RESEARCH_ROOT / "benchmark", 7)

            self.assertEqual(manifest["records"], 2)
            self.assertEqual(manifest["blinded_pairs"], 1)
            self.assertEqual(manifest["analysis_version"], "0.2.0")
            self.assertEqual(
                len((output / "blinded_annotation_pairs.jsonl").read_text().splitlines()), 1
            )
            self.assertIn("fixture-model", (output / "pilot_report.md").read_text())


if __name__ == "__main__":
    unittest.main()
