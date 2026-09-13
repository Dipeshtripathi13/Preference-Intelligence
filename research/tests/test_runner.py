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

from preference_intelligence_research.experiments.runner import (  # noqa: E402
    ExperimentConfig,
    run_experiment,
)
from preference_intelligence_research.models import Condition  # noqa: E402
from preference_intelligence_research.providers.base import ProviderConfig  # noqa: E402
from preference_intelligence_research.providers.mock import MockProvider  # noqa: E402
from preference_intelligence_research.statistics.summary import summarize  # noqa: E402


class RunnerTests(unittest.TestCase):
    def test_seeded_shuffle_and_replicates_are_reproducible(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            orders = []
            for suffix in ("a", "b"):
                output = Path(temporary) / f"shuffle-{suffix}.jsonl"
                config = ExperimentConfig(
                    experiment_id=f"shuffle-{suffix}",
                    requested_provider="mock",
                    requested_model="mock",
                    conditions=tuple(Condition),
                    personas_path=RESEARCH_ROOT / "benchmark/personas.json",
                    tasks_path=RESEARCH_ROOT / "benchmark/tasks.json",
                    output_path=output,
                    persona_ids=("p01_engineer_finance_novice",),
                    task_ids=("finance_duration_01",),
                    replicates=2,
                    shuffle_cells=True,
                    seed=17,
                    dry_run=True,
                )
                counts = run_experiment(config, MockProvider(ProviderConfig("mock", "mock")))
                self.assertEqual(counts["completed"], 10)
                records = [json.loads(line) for line in output.read_text().splitlines()]
                orders.append(
                    [
                        (record["replicate"], record["personalization_condition"])
                        for record in records
                    ]
                )
                manifest = json.loads(output.with_suffix(".manifest.json").read_text())
                self.assertEqual(manifest["replicates"], 2)
                self.assertTrue(manifest["shuffle_cells"])
            self.assertEqual(orders[0], orders[1])

    def test_existing_output_is_never_mixed_or_overwritten(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "existing.jsonl"
            output.write_text('{"old":true}\n', encoding="utf-8")
            config = ExperimentConfig(
                experiment_id="collision-test",
                requested_provider="mock",
                requested_model="mock",
                conditions=(Condition.NONE,),
                personas_path=RESEARCH_ROOT / "benchmark/personas.json",
                tasks_path=RESEARCH_ROOT / "benchmark/tasks.json",
                output_path=output,
                limit=1,
                dry_run=True,
            )
            with self.assertRaisesRegex(FileExistsError, "Refusing to mix"):
                run_experiment(config, MockProvider(ProviderConfig("mock", "mock")))
            self.assertEqual(output.read_text(encoding="utf-8"), '{"old":true}\n')

    def test_mock_run_logs_required_reproducibility_fields(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "pilot.jsonl"
            config = ExperimentConfig(
                experiment_id="unit-test",
                requested_provider="openai",
                requested_model="test-model",
                conditions=(Condition.NONE, Condition.DOMAIN_DYNAMIC),
                personas_path=RESEARCH_ROOT / "benchmark/personas.json",
                tasks_path=RESEARCH_ROOT / "benchmark/tasks.json",
                output_path=output,
                persona_ids=("p01_engineer_finance_novice",),
                task_ids=("finance_duration_01",),
                dry_run=True,
            )
            counts = run_experiment(
                config, MockProvider(ProviderConfig("mock", "test-model"))
            )
            self.assertEqual(counts, {"assigned": 2, "completed": 2, "failed": 0})
            records = [json.loads(line) for line in output.read_text().splitlines()]
            self.assertEqual(len(records), 2)
            required = {
                "experiment_id",
                "timestamp",
                "model_provider",
                "model_name",
                "model_version",
                "temperature",
                "system_prompt",
                "user_prompt",
                "personalization_condition",
                "preferences_selected",
                "compiled_preference_context",
                "token_counts",
                "latency_ms",
                "response",
                "evaluation_scores",
                "random_seed",
            }
            self.assertTrue(required.issubset(records[0]))
            self.assertFalse(records[0]["preferences_selected"])
            self.assertTrue(records[1]["preferences_selected"])
            manifest = json.loads(output.with_suffix(".manifest.json").read_text())
            self.assertTrue(manifest["dry_run"])
            self.assertEqual(manifest["actual_provider"], "mock")
            self.assertFalse(manifest["secrets_logged"])

            summary = summarize(output)
            self.assertEqual(summary["records"], 2)
            self.assertEqual(summary["failures"], 0)

    def test_portable_profile_can_drive_condition(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "profile.jsonl"
            config = ExperimentConfig(
                experiment_id="profile-test",
                requested_provider="mock",
                requested_model="mock",
                conditions=(Condition.DOMAIN_DYNAMIC,),
                personas_path=RESEARCH_ROOT / "benchmark/personas.json",
                tasks_path=RESEARCH_ROOT / "benchmark/tasks.json",
                output_path=output,
                persona_ids=("p01_engineer_finance_novice",),
                task_ids=("se_java_virtual_threads_01",),
                profile_path=RESEARCH_ROOT / "specification/example-profile.json",
                dry_run=True,
            )
            run_experiment(config, MockProvider(ProviderConfig("mock", "mock")))
            record = json.loads(output.read_text())
            selected_ids = {item["preference_id"] for item in record["preferences_selected"]}
            self.assertIn("23424e24-7eb1-4d78-b637-8d5216d46277", selected_ids)


if __name__ == "__main__":
    unittest.main()
