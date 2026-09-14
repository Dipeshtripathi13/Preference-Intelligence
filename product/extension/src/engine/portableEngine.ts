import { PreferenceEngine } from './engine';
import { MemoryPreferenceStore } from './store';
import type {
  PreferenceRecord,
  PreferenceUpdateEvent,
  ProductSettings,
  UsageDecision,
} from './types';

export interface ProcessPreferenceMessageInput {
  message: string;
  profile?: PreferenceRecord[];
  settings?: Partial<ProductSettings>;
  trustedUserAction?: boolean;
  provider?: string;
}

export interface ProcessPreferenceMessageOutput {
  profile: PreferenceRecord[];
  instruction: string;
  decisions: UsageDecision[];
  updates: PreferenceUpdateEvent[];
}

/**
 * Store-free convenience API for CLIs, MCP servers, coding agents, and other
 * clients. The caller owns persistence; the engine returns the updated profile.
 */
export async function processPreferenceMessage(
  input: ProcessPreferenceMessageInput,
): Promise<ProcessPreferenceMessageOutput> {
  const store = new MemoryPreferenceStore();
  for (const record of input.profile ?? []) await store.putPreference(record);
  if (input.settings) await store.putSettings({ ...await store.getSettings(), ...input.settings });
  const result = await new PreferenceEngine(store).processPrompt({
    prompt: input.message,
    provider: input.provider ?? 'portable-engine',
    trustedUserAction: input.trustedUserAction ?? true,
  });
  return {
    profile: await store.listPreferences(),
    instruction: result.instruction,
    decisions: result.decisions,
    updates: result.updates,
  };
}
