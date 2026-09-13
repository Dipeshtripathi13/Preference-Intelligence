"""Provider interface and safe HTTP utility."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from dataclasses import dataclass, replace
from typing import Any

from ..models import GenerationRequest, GenerationResult


class ProviderError(RuntimeError):
    """A sanitized provider failure safe to write to experiment logs."""


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    model: str
    timeout_seconds: float = 120.0
    base_url: str | None = None
    api_key: str | None = None

    def with_name(self, name: str) -> ProviderConfig:
        return replace(self, name=name)


class Provider(ABC):
    def __init__(self, config: ProviderConfig) -> None:
        self.config = config

    @property
    def name(self) -> str:
        return self.config.name

    @abstractmethod
    def generate(self, request: GenerationRequest) -> GenerationResult:
        raise NotImplementedError


def require_secret(config_value: str | None, environment_name: str) -> str:
    value = config_value or os.environ.get(environment_name)
    if not value:
        raise ProviderError(f"Missing required credential: {environment_name}")
    return value


def post_json(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str],
    timeout_seconds: float,
) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        # Do not include URLs: Gemini credentials may be carried in the query string.
        try:
            error_body = exc.read().decode("utf-8")[:500]
        except Exception:
            error_body = ""
        detail = f"; response={error_body}" if error_body else ""
        raise ProviderError(f"Provider HTTP error {exc.code}{detail}") from None
    except urllib.error.URLError as exc:
        raise ProviderError(f"Provider connection error: {exc.reason}") from None
    except TimeoutError:
        raise ProviderError("Provider request timed out") from None
    try:
        decoded = json.loads(body)
    except json.JSONDecodeError:
        raise ProviderError("Provider returned non-JSON data") from None
    if not isinstance(decoded, dict):
        raise ProviderError("Provider returned an unexpected JSON shape")
    return decoded
