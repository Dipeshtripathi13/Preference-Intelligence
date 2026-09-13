import { describe, expect, it } from 'vitest';
import { DomainClassifier } from '../src/engine/domainClassifier';
import { PreferenceRetriever } from '../src/engine/retriever';
import { MemoryPreferenceStore } from '../src/engine/store';
import { preference } from './helpers';

describe('domain isolation and inheritance', () => {
  it('does not transfer advanced Java depth to physics', async () => {
    const store = new MemoryPreferenceStore();
    await store.putPreference(preference('technical_depth', 'advanced', { domain: 'software_engineering', subdomain: 'java' }));
    const physics = new DomainClassifier().classify('Explain quantum entanglement in physics.');

    expect(physics).toMatchObject({ domain: 'science', subdomain: 'physics' });
    expect(await new PreferenceRetriever(store).retrieve(physics)).toEqual([]);
  });

  it('uses a domain preference over a global preference for the same dimension', async () => {
    const store = new MemoryPreferenceStore();
    await store.putPreference(preference('verbosity', 'concise'));
    const education = preference('verbosity', 'detailed', { domain: 'education' });
    await store.putPreference(education);
    const context = new DomainClassifier().classify('Teach this student with a lesson plan.');

    const selected = await new PreferenceRetriever(store).retrieve(context);

    expect(selected).toHaveLength(1);
    expect(selected[0].preference.id).toBe(education.id);
    expect(selected[0].preference.value).toBe('detailed');
  });

  it('falls back to a global preference when no domain preference matches', async () => {
    const store = new MemoryPreferenceStore();
    const global = preference('tone', 'professional');
    await store.putPreference(global);
    const selected = await new PreferenceRetriever(store).retrieve(new DomainClassifier().classify('Explain momentum in physics.'));
    expect(selected[0].preference.id).toBe(global.id);
  });

  it('withholds an inferred preference after its effective confidence decays', async () => {
    const store = new MemoryPreferenceStore();
    const stale = preference('tone', 'professional', {}, {
      confidence: 0.9,
      state: 'inferred',
      decayRate: 0.02,
      lastObservedAt: '2025-01-01T00:00:00.000Z',
    });
    await store.putPreference(stale);

    const selected = await new PreferenceRetriever(store).retrieve(
      new DomainClassifier().classify('Explain momentum in physics.'),
      'domain_conditioned',
      new Date('2026-01-01T00:00:00.000Z'),
    );

    expect(selected).toEqual([]);
  });
});
