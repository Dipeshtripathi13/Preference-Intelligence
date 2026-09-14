import { describe, expect, it } from 'vitest';
import { DomainClassifier } from '../src/engine/domainClassifier';
import { PreferenceRetriever } from '../src/engine/retriever';
import { MemoryPreferenceStore } from '../src/engine/store';
import { preference } from './helpers';

describe('domain isolation and inheritance', () => {
  it('abstains to general when domain evidence is uncertain', () => {
    expect(new DomainClassifier().classify('Could you help with this?')).toMatchObject({
      domain: 'general', method: 'abstained', confidence: 0.35,
    });
  });
  it('does not transfer advanced Java depth to physics', async () => {
    const store = new MemoryPreferenceStore();
    await store.putPreference(preference('technical_depth', 'advanced', { domain: 'software_engineering', subdomain: 'java' }));
    const physics = new DomainClassifier().classify('Explain quantum entanglement in physics.');

    expect(physics).toMatchObject({ domain: 'science', subdomain: 'physics' });
    expect(await new PreferenceRetriever(store).retrieve(physics)).toEqual([]);
  });

  it('makes cross-domain abstention inspectable', async () => {
    const store = new MemoryPreferenceStore();
    await store.putPreference(preference('technical_depth', 'advanced', { domain: 'software_engineering', subdomain: 'java' }));
    const finance = new DomainClassifier().classify('Explain bond duration and convexity.');
    const result = await new PreferenceRetriever(store).evaluate(finance);
    expect(result.selected).toEqual([]);
    expect(result.decisions[0]).toMatchObject({ status: 'suppressed_scope', scopeMatch: 0 });
    expect(result.decisions[0].reason).toContain('software_engineering');
  });

  it('recognizes fixed income and infrastructure contexts', () => {
    const classifier = new DomainClassifier();
    expect(classifier.classify('Explain bond duration and convexity.')).toMatchObject({ domain: 'finance', subdomain: 'fixed_income' });
    expect(classifier.classify('Explain Kubernetes StatefulSets and operators.')).toMatchObject({ domain: 'software_engineering', subdomain: 'infrastructure' });
  });

  it('exposes multi-domain candidates while choosing one primary context', () => {
    const context = new DomainClassifier().classify('Implement a Python mortgage amortization calculator.');
    expect(context.domains?.map(({ domain }) => domain)).toEqual(expect.arrayContaining(['software_engineering', 'finance']));
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

  it('withholds expired temporary preferences and reports why', async () => {
    const store = new MemoryPreferenceStore();
    await store.putPreference(preference('tone', 'casual', {}, {
      lifetime: 'temporary',
      expiresAt: '2026-09-12T12:00:00.000Z',
    }));
    const result = await new PreferenceRetriever(store).evaluate(
      new DomainClassifier().classify('Explain momentum in physics.'),
      'domain_conditioned',
      new Date('2026-09-13T12:00:00.000Z'),
    );
    expect(result.selected).toEqual([]);
    expect(result.decisions[0].status).toBe('suppressed_expired');
  });

  it('keeps a valid preference while honoring a context-specific applicability correction', async () => {
    const store = new MemoryPreferenceStore();
    const record = preference('verbosity', 'concise', {}, {
      notApplicableTo: [{ domain: 'education', task: 'explanation' }],
    });
    await store.putPreference(record);
    const retriever = new PreferenceRetriever(store);
    const education = await retriever.evaluate({ domain: 'education', task: 'explanation', confidence: 0.8 });
    const finance = await retriever.evaluate({ domain: 'finance', task: 'explanation', confidence: 0.8 });
    expect(education.selected).toEqual([]);
    expect(education.decisions[0].status).toBe('suppressed_applicability');
    expect(finance.selected[0].preference.id).toBe(record.id);
  });
});
