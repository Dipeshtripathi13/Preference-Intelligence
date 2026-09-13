import { describe, expect, it } from 'vitest';
import { PreferenceRetriever } from '../src/engine/retriever';
import { MemoryPreferenceStore } from '../src/engine/store';
import { PreferenceUpdater } from '../src/engine/updater';
import { preference } from './helpers';

const now = '2026-09-13T12:00:00.000Z';

describe('PreferenceUpdater', () => {
  it('increases confidence for repeated consistent evidence', async () => {
    const store = new MemoryPreferenceStore();
    const updater = new PreferenceUpdater(store);
    const evidence = { dimension: 'verbosity' as const, value: 'concise', scope: {}, strength: 0.8, sourceType: 'explicit_feedback' as const, origin: 'user_composer' as const, observedAt: now, signal: 'asks_for_conciseness' };
    const first = await updater.apply(evidence);
    const second = await updater.apply({ ...evidence, observedAt: '2026-09-14T12:00:00.000Z' });
    expect(second.confidence).toBeGreaterThan(first.confidence);
    expect(second.evidenceCount).toBe(2);
  });

  it('marks contradictory evidence ambiguous instead of silently preserving certainty', async () => {
    const store = new MemoryPreferenceStore();
    const existing = preference('verbosity', 'concise', {}, { state: 'inferred', confidence: 0.75 });
    await store.putPreference(existing);
    const updated = await new PreferenceUpdater(store).apply({ dimension: 'verbosity', value: 'detailed', scope: {}, strength: 0.9, sourceType: 'explicit_feedback', origin: 'user_composer', observedAt: now, signal: 'asks_for_detail' });
    expect(updated.state).toBe('ambiguous');
    expect(updated.confidence).toBeLessThan(existing.confidence);
  });

  it('never modifies a locked preference', async () => {
    const store = new MemoryPreferenceStore();
    const locked = preference('verbosity', 'concise', {}, { locked: true, state: 'locked', confidence: 1 });
    await store.putPreference(locked);
    const result = await new PreferenceUpdater(store).apply({ dimension: 'verbosity', value: 'detailed', scope: {}, strength: 1, sourceType: 'explicit_feedback', origin: 'user_composer', observedAt: now, signal: 'asks_for_detail' });
    expect(result).toEqual(locked);
  });

  it('does not compile one weak implicit signal', async () => {
    const store = new MemoryPreferenceStore();
    const updater = new PreferenceUpdater(store);
    const record = await updater.apply({ dimension: 'example_preference', value: 'preferred', scope: {}, strength: 0.4, sourceType: 'implicit_feedback', origin: 'user_composer', observedAt: now, signal: 'weak_repeated_example_request' });
    expect(record.confidence).toBeLessThan(0.35);
    const selected = await new PreferenceRetriever(store).retrieve({ domain: 'general', task: 'general', confidence: 0.35 });
    expect(selected).toEqual([]);
  });
});
