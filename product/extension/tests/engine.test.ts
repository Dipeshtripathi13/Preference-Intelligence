import { describe, expect, it } from 'vitest';
import { PreferenceEngine } from '../src/engine/engine';
import { MemoryPreferenceStore } from '../src/engine/store';
import { DIMENSIONS, VALUES_BY_DIMENSION } from '../src/engine/types';
import { preference } from './helpers';

describe('PreferenceEngine', () => {
  it('executes but does not persist a current-only preference request', async () => {
    const store = new MemoryPreferenceStore();
    await new PreferenceEngine(store).processPrompt({
      prompt: 'For this one, explain from scratch.',
      provider: 'chatgpt',
      trustedUserAction: true,
    });
    expect(await store.listPreferences()).toEqual([]);
  });

  it('does not learn when the content boundary cannot prove a user action', async () => {
    const store = new MemoryPreferenceStore();
    await new PreferenceEngine(store).processPrompt({
      prompt: 'Always keep answers concise.',
      provider: 'claude',
      trustedUserAction: false,
    });
    expect(await store.listPreferences()).toEqual([]);
  });

  it('stores compact why-used logs without raw prompt by default', async () => {
    const store = new MemoryPreferenceStore();
    await new PreferenceEngine(store).processPrompt({ prompt: 'Always keep answers concise.', provider: 'chatgpt', trustedUserAction: true });
    const [log] = await store.listUsageLogs();
    expect(log.decisions[0].status).toBe('used');
    expect(log.rawPrompt).toBeUndefined();
  });

  it('requires repeated implicit corrections before applying them', async () => {
    const store = new MemoryPreferenceStore();
    const engine = new PreferenceEngine(store);
    const first = await engine.processPrompt({ prompt: 'Make this shorter.', provider: 'chatgpt', trustedUserAction: true });
    const second = await engine.processPrompt({ prompt: 'Make this shorter.', provider: 'chatgpt', trustedUserAction: true });

    expect(first.selected).toEqual([]);
    expect(second.selected).toHaveLength(1);
    expect(second.selected[0].preference.sourceType).toBe('implicit_feedback');
  });

  it('limits excessive eligible preferences and records budget suppression', async () => {
    const store = new MemoryPreferenceStore();
    for (const dimension of DIMENSIONS) {
      await store.putPreference(preference(dimension, VALUES_BY_DIMENSION[dimension][1], {}));
    }
    const result = await new PreferenceEngine(store).processPrompt({
      prompt: 'Implement a Java function and explain the calculation.',
      provider: 'chatgpt',
      trustedUserAction: false,
    });
    expect(result.selected).toHaveLength(8);
    expect(result.decisions.filter(({ status }) => status === 'suppressed_budget').length).toBeGreaterThan(0);
  });
});
