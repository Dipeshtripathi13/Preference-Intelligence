"""Provider adapters and factory."""

from __future__ import annotations

from .anthropic import AnthropicProvider
from .base import Provider, ProviderConfig, ProviderError
from .gemini import GeminiProvider
from .local import LocalProvider
from .mock import MockProvider
from .openai import OpenAIProvider


def create_provider(config: ProviderConfig, *, dry_run: bool = False) -> Provider:
    """Create an adapter; dry runs always use the network-free mock provider."""

    if dry_run or config.name == "mock":
        return MockProvider(config.with_name("mock"))
    providers: dict[str, type[Provider]] = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "gemini": GeminiProvider,
        "local": LocalProvider,
    }
    provider_type = providers.get(config.name)
    if provider_type is None:
        raise ProviderError(f"Unknown provider: {config.name}")
    return provider_type(config)


__all__ = ["Provider", "ProviderConfig", "ProviderError", "create_provider"]
