import type { ProviderAdapter } from './base';
import { ChatGptAdapter } from './chatgpt';
import { ClaudeAdapter } from './claude';

const ENABLED_ADAPTERS: readonly ProviderAdapter[] = [new ChatGptAdapter(), new ClaudeAdapter()];

export function adapterFor(location: Location): ProviderAdapter | undefined {
  return ENABLED_ADAPTERS.find((adapter) => adapter.matches(location));
}
