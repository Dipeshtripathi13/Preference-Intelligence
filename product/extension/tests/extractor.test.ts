import { describe, expect, it } from 'vitest';
import { PreferenceExtractor } from '../src/engine/extractor';

const context = { domain: 'software_engineering' as const, subdomain: 'java', task: 'explanation' as const, confidence: 0.9 };

describe('PreferenceExtractor trust and durability', () => {
  it('rejects assistant-authored and webpage evidence', () => {
    const extractor = new PreferenceExtractor();
    for (const origin of ['assistant_message', 'webpage_content'] as const) {
      expect(extractor.extract({ text: 'Always keep answers concise.', context, origin, isTrustedUserAction: true })).toEqual([]);
    }
  });

  it('does not model sensitive demographic claims as response preferences', () => {
    expect(new PreferenceExtractor().extract({
      text: 'I am a child and my religion and political identity should be remembered.',
      context,
      origin: 'user_composer',
      isTrustedUserAction: true,
    })).toEqual([]);
  });

  it('rejects a synthetic composer action', () => {
    expect(new PreferenceExtractor().extract({
      text: 'Always keep answers concise.', context, origin: 'user_composer', isTrustedUserAction: false,
    })).toEqual([]);
  });

  it('learns a durable explicit preference without storing raw text', () => {
    const evidence = new PreferenceExtractor().extract({
      text: 'From now on, always keep answers concise.', context, origin: 'user_composer', isTrustedUserAction: true,
    });
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({ dimension: 'verbosity', value: 'concise', signal: 'asks_for_conciseness' });
    expect(evidence[0].sourceType).toBe('explicit_feedback');
    expect(evidence[0]).not.toHaveProperty('text');
  });

  it('treats a correction without durable language as weaker implicit evidence', () => {
    const evidence = new PreferenceExtractor().extract({
      text: 'Make this shorter.', context, origin: 'user_composer', isTrustedUserAction: true,
    });
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      dimension: 'verbosity',
      value: 'concise',
      sourceType: 'implicit_feedback',
    });
  });

  it('does not persist a current-only request', () => {
    const extractor = new PreferenceExtractor();
    expect(extractor.extract({
      text: 'For this one, explain from scratch and use a detailed answer.', context, origin: 'user_composer', isTrustedUserAction: true,
    })).toEqual([]);
    expect(extractor.currentTurnConstraints('For this one, explain from scratch and use a detailed answer.').get('technical_depth')).toBe('beginner');
  });

  it('extracts v1 corrections into global scope', () => {
    const extractor = new PreferenceExtractor();
    expect(extractor.extract({
      text: 'For finance, use more real-world examples.',
      context: { domain: 'finance', task: 'explanation', confidence: 0.8 },
      origin: 'user_composer',
      isTrustedUserAction: true,
    })[0]).toMatchObject({ dimension: 'example_preference', value: 'preferred', scope: {}, evidenceKind: 'direct_correction' });
    expect(extractor.extract({
      text: 'Show me the implementation.', context, origin: 'user_composer', isTrustedUserAction: true,
    })[0]).toMatchObject({ dimension: 'code_preference', value: 'preferred' });
  });
});
