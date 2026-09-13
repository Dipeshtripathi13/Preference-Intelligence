"""OpenAI Chat Completions adapter using only the Python standard library."""

from __future__ import annotations

from ..models import GenerationRequest, GenerationResult
from .base import Provider, ProviderError, post_json, require_secret


class OpenAIProvider(Provider):
    def generate(self, request: GenerationRequest) -> GenerationResult:
        key = require_secret(self.config.api_key, "OPENAI_API_KEY")
        base_url = (self.config.base_url or "https://api.openai.com").rstrip("/")
        payload = {
            "model": request.model,
            "messages": [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
            "seed": request.seed,
        }
        if request.reasoning_effort is not None:
            payload["reasoning_effort"] = request.reasoning_effort
        data = post_json(
            f"{base_url}/v1/chat/completions",
            payload,
            {"Authorization": f"Bearer {key}"},
            self.config.timeout_seconds,
        )
        try:
            choice = data["choices"][0]
            text = choice["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderError("OpenAI response did not contain message content") from exc
        usage = data.get("usage", {})
        return GenerationResult(
            text=str(text),
            returned_model=data.get("model"),
            model_version=data.get("system_fingerprint"),
            input_tokens=usage.get("prompt_tokens"),
            output_tokens=usage.get("completion_tokens"),
            finish_reason=choice.get("finish_reason"),
            raw_metadata={
                "id": data.get("id"),
                "system_fingerprint": data.get("system_fingerprint"),
            },
        )
