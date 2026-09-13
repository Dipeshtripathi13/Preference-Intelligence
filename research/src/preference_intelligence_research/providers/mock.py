"""Deterministic, network-free provider for tests and dry runs."""

from __future__ import annotations

import hashlib
import json

from ..evaluation.metrics import approximate_token_count
from ..models import GenerationRequest, GenerationResult
from .base import Provider


class MockProvider(Provider):
    def generate(self, request: GenerationRequest) -> GenerationResult:
        digest = hashlib.sha256(
            f"{request.seed}\0{request.system_prompt}\0{request.user_prompt}".encode()
        ).hexdigest()[:12]
        lower_prompt = request.user_prompt.lower()
        if "return only valid json" in lower_prompt:
            text = json.dumps(
                {
                    "goal": "[MOCK] weekly reading habit",
                    "first_step": "Choose a recurring time",
                    "risk": "Schedule conflicts",
                },
                separators=(",", ":"),
            )
        elif "python function" in lower_prompt or "react counter" in lower_prompt:
            text = (
                "[MOCK RESPONSE: not research evidence]\n\n"
                "```text\nDeterministic placeholder code\n```\n"
                f"Request fingerprint: {digest}"
            )
        else:
            personalized = "Relevant response preferences" in request.system_prompt
            history = "preference history" in request.system_prompt
            text = (
                "[MOCK RESPONSE: not research evidence]\n"
                f"Request received: {request.user_prompt}\n"
                f"Structured context present: {str(personalized).lower()}; "
                f"history context present: {str(history).lower()}; fingerprint: {digest}."
            )
        return GenerationResult(
            text=text,
            returned_model=request.model,
            model_version="deterministic-mock-0.1",
            input_tokens=approximate_token_count(request.system_prompt + request.user_prompt),
            output_tokens=approximate_token_count(text),
            finish_reason="stop",
            raw_metadata={"mock": True, "fingerprint": digest},
        )
