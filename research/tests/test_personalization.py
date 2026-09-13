from __future__ import annotations

import sys
import unittest
from pathlib import Path

RESEARCH_ROOT = Path(__file__).resolve().parents[1]
SRC = RESEARCH_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from preference_intelligence_research.data import load_personas, load_tasks  # noqa: E402
from preference_intelligence_research.models import (  # noqa: E402
    Condition,
    Persona,
    Preference,
    Scope,
    Task,
)
from preference_intelligence_research.personalization.conditions import (  # noqa: E402
    compile_personalization,
)


class PersonalizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.personas = {
            item.id: item
            for item in load_personas(RESEARCH_ROOT / "benchmark/personas.json")
        }
        cls.tasks = {item.id: item for item in load_tasks(RESEARCH_ROOT / "benchmark/tasks.json")}

    def test_domain_isolation_keeps_finance_beginner(self) -> None:
        persona = self.personas["p01_engineer_finance_novice"]
        task = self.tasks["finance_duration_01"]
        bundle = compile_personalization(Condition.DOMAIN_DYNAMIC, persona, task)
        dimensions = {item.dimension: item.value for item in bundle.selected_preferences}
        self.assertEqual(dimensions["technical_depth"], "beginner")
        self.assertNotIn("skip_basic_syntax", dimensions.values())
        self.assertFalse(
            any(item.scope.domain == "software_engineering" for item in bundle.selected_preferences)
        )

    def test_domain_specific_value_overrides_global(self) -> None:
        task = Task(
            id="t",
            split="development",
            template_family="test",
            domain="education",
            subdomain=None,
            task_type="explanation",
            difficulty="introductory",
            prompt="Explain fractions",
            reference_points=(),
            automatic_checks={},
            human_emphasis=(),
        )
        persona = Persona(
            id="p",
            label="test",
            description="",
            static_profile="",
            preferences=(
                Preference("global", "verbosity", "concise", Scope(), 1.0),
                Preference("domain", "verbosity", "detailed", Scope(domain="education"), 0.8),
            ),
            feedback_history=(),
        )
        bundle = compile_personalization(Condition.DOMAIN_DYNAMIC, persona, task)
        self.assertEqual(len(bundle.selected_preferences), 1)
        self.assertEqual(bundle.selected_preferences[0].value, "detailed")

    def test_no_personalization_contains_no_profile_data(self) -> None:
        persona = self.personas["p01_engineer_finance_novice"]
        task = self.tasks["finance_duration_01"]
        bundle = compile_personalization(Condition.NONE, persona, task)
        self.assertEqual(bundle.compiled_context, "")
        self.assertEqual(bundle.selected_preferences, ())
        self.assertNotIn("concise", bundle.system_prompt)

    def test_all_five_condition_paths_compile(self) -> None:
        persona = self.personas["p03_executive_science_learner"]
        task = self.tasks["general_json_override_01"]
        bundles = {
            condition: compile_personalization(condition, persona, task)
            for condition in Condition
        }
        self.assertEqual(set(bundles), set(Condition))
        self.assertEqual(bundles[Condition.NONE].compiled_context, "")
        self.assertIn("static global", bundles[Condition.STATIC_GLOBAL].compiled_context)
        self.assertIn("history", bundles[Condition.HISTORY_RAG].compiled_context)
        self.assertTrue(bundles[Condition.DYNAMIC_GLOBAL].selected_preferences)
        self.assertTrue(bundles[Condition.DOMAIN_DYNAMIC].selected_preferences)
        for bundle in bundles.values():
            self.assertIn("current explicit request has priority", bundle.system_prompt)

    def test_mock_current_format_override_returns_valid_json(self) -> None:
        import json

        from preference_intelligence_research.models import GenerationRequest
        from preference_intelligence_research.providers.base import ProviderConfig
        from preference_intelligence_research.providers.mock import MockProvider

        persona = self.personas["p03_executive_science_learner"]
        task = self.tasks["general_json_override_01"]
        bundle = compile_personalization(Condition.DOMAIN_DYNAMIC, persona, task)
        response = MockProvider(ProviderConfig("mock", "mock")).generate(
            GenerationRequest("mock", bundle.system_prompt, task.prompt, 0.0, 200, 9)
        )
        parsed = json.loads(response.text)
        self.assertEqual(set(parsed), {"goal", "first_step", "risk"})

    def test_history_retrieval_rejects_non_user_authors(self) -> None:
        persona = self.personas["p01_engineer_finance_novice"]
        task = self.tasks["finance_duration_01"]
        bundle = compile_personalization(Condition.HISTORY_RAG, persona, task)
        self.assertNotIn("p01e4", bundle.retrieved_event_ids)
        self.assertNotIn("expert bond trader", bundle.compiled_context)

    def test_low_confidence_inference_is_gated_but_lock_wins(self) -> None:
        task = self.tasks["general_passwords_01"]
        base = dict(
            dimension="tone",
            value="direct",
            scope=Scope(),
            confidence=0.2,
        )
        unlocked = Preference("unlocked", **base)
        locked = Preference("locked", **base, user_locked=True)
        persona = Persona("p", "p", "", "", (unlocked,), ())
        self.assertFalse(
            compile_personalization(Condition.DOMAIN_DYNAMIC, persona, task).selected_preferences
        )
        persona = Persona("p", "p", "", "", (locked,), ())
        self.assertEqual(
            compile_personalization(Condition.DOMAIN_DYNAMIC, persona, task)
            .selected_preferences[0]
            .preference_id,
            "locked",
        )

    def test_compact_compiler_reduces_context_without_changing_selection(self) -> None:
        persona = self.personas["p01_engineer_finance_novice"]
        task = self.tasks["finance_duration_01"]
        compact = compile_personalization(
            Condition.DOMAIN_DYNAMIC, persona, task, compiler_variant="compact_v2"
        )
        verbose = compile_personalization(
            Condition.DOMAIN_DYNAMIC, persona, task, compiler_variant="verbose_v1"
        )
        self.assertEqual(compact.selected_preferences, verbose.selected_preferences)
        self.assertLess(len(compact.compiled_context), len(verbose.compiled_context))
        self.assertNotIn("confidence:", compact.compiled_context)
        self.assertIn("Current request wins", compact.compiled_context)


if __name__ == "__main__":
    unittest.main()
