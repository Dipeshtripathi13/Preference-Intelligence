from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

RESEARCH_ROOT = Path(__file__).resolve().parents[1]
SRC = RESEARCH_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from preference_intelligence_research.data import (  # noqa: E402
    CANONICAL_DIMENSIONS,
    DataValidationError,
    load_personas,
    load_profile_preferences,
    load_tasks,
    validate_profile_contract,
)


class BenchmarkDataTests(unittest.TestCase):
    def test_benchmark_is_nontrivial_and_unique(self) -> None:
        personas = load_personas(RESEARCH_ROOT / "benchmark" / "personas.json")
        tasks = load_tasks(RESEARCH_ROOT / "benchmark" / "tasks.json")
        self.assertGreaterEqual(len(personas), 4)
        self.assertGreaterEqual(len(tasks), 12)
        self.assertEqual(len({item.id for item in personas}), len(personas))
        self.assertEqual(len({item.id for item in tasks}), len(tasks))
        self.assertGreaterEqual(len({item.domain for item in tasks}), 6)
        for persona in personas:
            for preference in persona.preferences:
                self.assertIn(preference.dimension, CANONICAL_DIMENSIONS)
                self.assertTrue(0 <= preference.confidence <= 1)

    def test_canonical_profile_contract_is_consumable(self) -> None:
        profile_path = RESEARCH_ROOT / "specification" / "example-profile.json"
        payload = json.loads(profile_path.read_text(encoding="utf-8"))
        validate_profile_contract(payload)
        preferences = load_profile_preferences(profile_path)
        self.assertEqual(len(preferences), len(payload["preferences"]))
        self.assertEqual(preferences[0].scope.to_dict(), payload["preferences"][0]["scope"])
        self.assertEqual(preferences[0].dimension, payload["preferences"][0]["dimension"])

    def test_runner_contract_matches_canonical_schema_dimensions_and_scope(self) -> None:
        schema = json.loads(
            (RESEARCH_ROOT / "specification" / "preference-profile.schema.json").read_text()
        )
        preference_schema = schema["$defs"]["preference"]
        schema_dimensions = set(preference_schema["properties"]["dimension"]["oneOf"][0]["enum"])
        self.assertEqual(schema_dimensions, CANONICAL_DIMENSIONS)
        scope_schema = schema["$defs"]["scope"]
        self.assertEqual(set(scope_schema["required"]), {"domain", "subdomain", "task"})
        self.assertFalse(scope_schema["additionalProperties"])

    def test_contract_rejects_noncanonical_dimension(self) -> None:
        profile_path = RESEARCH_ROOT / "specification" / "example-profile.json"
        payload = json.loads(profile_path.read_text(encoding="utf-8"))
        payload["preferences"][0]["dimension"] = "favorite_person"
        with self.assertRaises(DataValidationError):
            validate_profile_contract(payload)

    def test_full_json_schema_when_optional_dependency_is_installed(self) -> None:
        try:
            import jsonschema
        except ImportError:
            self.skipTest("Install the dev extra for full JSON Schema validation")
        schema = json.loads(
            (RESEARCH_ROOT / "specification" / "preference-profile.schema.json").read_text()
        )
        profile = json.loads(
            (RESEARCH_ROOT / "specification" / "example-profile.json").read_text()
        )
        jsonschema.Draft202012Validator(schema, format_checker=jsonschema.FormatChecker()).validate(
            profile
        )


if __name__ == "__main__":
    unittest.main()
