"""Anthropic Messages API adapter."""

from __future__ import annotations

import os

from ..models import GenerationRequest, GenerationResult
from .base import Provider, ProviderError, post_json, require_secret


class AnthropicProvider(Provider):
    def generate(self, request: GenerationRequest) -> GenerationResult:
        key = require_secret(self.config.api_key, "ANTHROPIC_API_KEY")
        base_url = (self.config.base_url or "https://api.anthropic.com").rstrip("/")
        version = os.environ.get("ANTHROPIC_API_VERSION", "2023-06-01")
        payload = {
            "model": request.model,
            "system": request.system_prompt,
            "messages": [{"role": "user", "content": request.user_prompt}],
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
        }
        data = post_json(
            f"{base_url}/v1/messages",
            payload,
            {"x-api-key": key, "anthropic-version": version},
            self.config.timeout_seconds,
        )
        try:
            text = "".join(
                str(block.get("text", ""))
                for block in data["content"]
                if block.get("type") == "text"
            )
        except (KeyError, TypeError) as exc:
            raise ProviderError("Anthropic response did not contain text content") from exc
        if not text:
            raise ProviderError("Anthropic response contained no text block")
        usage = data.get("usage", {})
        return GenerationResult(
            text=text,
            returned_model=data.get("model"),
            model_version=None,
            input_tokens=usage.get("input_tokens"),
            output_tokens=usage.get("output_tokens"),
            finish_reason=data.get("stop_reason"),
            raw_metadata={"id": data.get("id"), "api_version": version},
        )
