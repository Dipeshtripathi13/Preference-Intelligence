"""Google Gemini generateContent adapter."""

from __future__ import annotations

import os
import urllib.parse

from ..models import GenerationRequest, GenerationResult
from .base import Provider, ProviderError, post_json, require_secret


class GeminiProvider(Provider):
    def generate(self, request: GenerationRequest) -> GenerationResult:
        key = require_secret(self.config.api_key, "GEMINI_API_KEY")
        base_url = (self.config.base_url or "https://generativelanguage.googleapis.com").rstrip("/")
        version = os.environ.get("GEMINI_API_VERSION", "v1beta")
        model_path = urllib.parse.quote(request.model, safe="-_.")
        escaped_key = urllib.parse.quote(key, safe="")
        url = f"{base_url}/{version}/models/{model_path}:generateContent?key={escaped_key}"
        payload = {
            "systemInstruction": {"parts": [{"text": request.system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": request.user_prompt}]}],
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_output_tokens,
            },
        }
        data = post_json(url, payload, {}, self.config.timeout_seconds)
        try:
            candidate = data["candidates"][0]
            text = "".join(str(part.get("text", "")) for part in candidate["content"]["parts"])
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderError("Gemini response did not contain text content") from exc
        usage = data.get("usageMetadata", {})
        return GenerationResult(
            text=text,
            returned_model=request.model,
            model_version=data.get("modelVersion"),
            input_tokens=usage.get("promptTokenCount"),
            output_tokens=usage.get("candidatesTokenCount"),
            finish_reason=candidate.get("finishReason"),
            raw_metadata={"response_id": data.get("responseId"), "api_version": version},
        )
