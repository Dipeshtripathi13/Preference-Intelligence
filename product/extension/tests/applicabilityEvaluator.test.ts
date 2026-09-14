import { describe, expect, it } from 'vitest';
import { ApplicabilityEvaluator } from '../src/engine/applicabilityEvaluator';
import { preference } from './helpers';

describe('ApplicabilityEvaluator', () => {
  it('separates evidence confidence from contextual applicability', () => {
    const record = preference('code_preference', 'preferred', {}, { confidence: 0.99, locked: true, state: 'locked' });
    const result = new ApplicabilityEvaluator().evaluate(record, {
      domain: 'finance', subdomain: 'fixed_income', task: 'explanation', confidence: 0.84,
    });
    expect(result.evidenceConfidence).toBe(0.99);
    expect(result.semanticRelevance).toBe(0.3);
    expect(result.applicable).toBe(false);
  });

  it('accepts a code preference for implementation', () => {
    const result = new ApplicabilityEvaluator().evaluate(
      preference('code_preference', 'preferred', { domain: 'software_engineering' }),
      { domain: 'software_engineering', subdomain: 'java', task: 'implementation', confidence: 0.88 },
    );
    expect(result.applicable).toBe(true);
    expect(result.scopeMatch).toBe(0.9);
  });

  it('withholds domain-sensitive defaults after classifier abstention', () => {
    const result = new ApplicabilityEvaluator().evaluate(
      preference('technical_depth', 'advanced', {}, { confidence: 0.99 }),
      { domain: 'general', task: 'general', confidence: 0.35, method: 'abstained' },
    );
    expect(result.applicable).toBe(false);
    expect(result.semanticRelevance).toBe(0.2);
  });
});
