"""OpenAI-compatible local model adapter."""

from __future__ import annotations

import os

from ..models import GenerationRequest, GenerationResult
from .base import Provider, ProviderError, post_json


class LocalProvider(Provider):
    def generate(self, request: GenerationRequest) -> GenerationResult:
        base_url = self.config.base_url or os.environ.get("LOCAL_MODEL_BASE_URL")
        if not base_url:
            raise ProviderError("Missing local endpoint: set LOCAL_MODEL_BASE_URL or --base-url")
        key = self.config.api_key or os.environ.get("LOCAL_MODEL_API_KEY")
        headers = {"Authorization": f"Bearer {key}"} if key else {}
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
            f"{base_url.rstrip('/')}/v1/chat/completions",
            payload,
            headers,
            self.config.timeout_seconds,
        )
        try:
            choice = data["choices"][0]
            text = choice["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderError("Local provider response did not contain message content") from exc
        usage = data.get("usage", {})
        return GenerationResult(
            text=str(text),
            returned_model=data.get("model", request.model),
            model_version=data.get("system_fingerprint"),
            input_tokens=usage.get("prompt_tokens"),
            output_tokens=usage.get("completion_tokens"),
            finish_reason=choice.get("finish_reason"),
            raw_metadata={"id": data.get("id"), "local": True},
        )
