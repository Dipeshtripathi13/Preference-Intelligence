from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

RESEARCH_ROOT = Path(__file__).resolve().parents[1]
SRC = RESEARCH_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from preference_intelligence_research.models import GenerationRequest  # noqa: E402
from preference_intelligence_research.providers import create_provider  # noqa: E402
from preference_intelligence_research.providers.base import (  # noqa: E402
    ProviderConfig,
    ProviderError,
)


class ProviderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.request = GenerationRequest("test-model", "system", "hello", 0.0, 20, 7)

    def test_dry_run_forces_mock_without_importing_an_sdk(self) -> None:
        provider = create_provider(ProviderConfig("anthropic", "test-model"), dry_run=True)
        self.assertEqual(provider.name, "mock")
        result = provider.generate(self.request)
        self.assertIn("MOCK RESPONSE", result.text)

    def test_missing_credential_error_names_actionable_variable(self) -> None:
        provider = create_provider(ProviderConfig("openai", "test-model"))
        with (
            patch.dict("os.environ", {}, clear=True),
            self.assertRaisesRegex(ProviderError, "OPENAI_API_KEY"),
        ):
            provider.generate(self.request)

    def test_openai_response_mapping_without_network(self) -> None:
        provider = create_provider(ProviderConfig("openai", "test-model", api_key="test-key"))
        payload = {
            "id": "response-id",
            "model": "returned-model",
            "system_fingerprint": "snapshot",
            "choices": [{"message": {"content": "answer"}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 3, "completion_tokens": 2},
        }
        with patch(
            "preference_intelligence_research.providers.openai.post_json", return_value=payload
        ):
            result = provider.generate(self.request)
        self.assertEqual(result.text, "answer")
        self.assertEqual(result.returned_model, "returned-model")
        self.assertEqual(result.input_tokens, 3)

    def test_anthropic_response_mapping_without_network(self) -> None:
        provider = create_provider(
            ProviderConfig("anthropic", "test-model", api_key="test-key")
        )
        payload = {
            "id": "response-id",
            "model": "returned-model",
            "content": [{"type": "text", "text": "answer"}],
            "stop_reason": "end_turn",
            "usage": {"input_tokens": 3, "output_tokens": 2},
        }
        with patch(
            "preference_intelligence_research.providers.anthropic.post_json",
            return_value=payload,
        ):
            result = provider.generate(self.request)
        self.assertEqual(result.text, "answer")
        self.assertEqual(result.output_tokens, 2)

    def test_gemini_response_mapping_without_network(self) -> None:
        provider = create_provider(ProviderConfig("gemini", "test-model", api_key="test-key"))
        payload = {
            "modelVersion": "snapshot",
            "responseId": "response-id",
            "candidates": [
                {
                    "content": {"parts": [{"text": "answer"}]},
                    "finishReason": "STOP",
                }
            ],
            "usageMetadata": {"promptTokenCount": 3, "candidatesTokenCount": 2},
        }
        with patch(
            "preference_intelligence_research.providers.gemini.post_json",
            return_value=payload,
        ):
            result = provider.generate(self.request)
        self.assertEqual(result.text, "answer")
        self.assertEqual(result.model_version, "snapshot")

    def test_local_response_mapping_without_network(self) -> None:
        provider = create_provider(
            ProviderConfig("local", "test-model", base_url="http://127.0.0.1:9999")
        )
        payload = {
            "model": "local-model",
            "choices": [{"message": {"content": "answer"}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 3, "completion_tokens": 2},
        }
        with patch(
            "preference_intelligence_research.providers.local.post_json", return_value=payload
        ):
            result = provider.generate(self.request)
        self.assertEqual(result.text, "answer")
        self.assertEqual(result.returned_model, "local-model")

    def test_local_adapter_forwards_explicit_reasoning_control(self) -> None:
        provider = create_provider(
            ProviderConfig("local", "test-model", base_url="http://127.0.0.1:9999")
        )
        request = GenerationRequest(
            "test-model", "system", "hello", 0.2, 50, 7, reasoning_effort="none"
        )
        payload = {
            "model": "local-model",
            "choices": [{"message": {"content": "answer"}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 3, "completion_tokens": 2},
        }
        with patch(
            "preference_intelligence_research.providers.local.post_json", return_value=payload
        ) as post:
            provider.generate(request)
        self.assertEqual(post.call_args.args[1]["reasoning_effort"], "none")


if __name__ == "__main__":
    unittest.main()
