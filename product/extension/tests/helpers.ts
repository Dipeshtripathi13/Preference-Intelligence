import type { PreferenceRecord, RankedPreference, Scope } from '../src/engine/types';

let sequence = 0;

export function preference(
  dimension: PreferenceRecord['dimension'],
  value: string,
  scope: Scope = {},
  overrides: Partial<PreferenceRecord> = {},
): PreferenceRecord {
  sequence += 1;
  const now = '2026-09-13T12:00:00.000Z';
  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    dimension,
    value,
    scope,
    confidence: 0.9,
    evidenceCount: 3,
    createdAt: now,
    updatedAt: now,
    lastObservedAt: now,
    sourceType: 'explicit_feedback',
    state: 'confirmed',
    locked: false,
    enabled: true,
    decayRate: 0.002,
    provenance: [{ id: `evidence-${sequence}`, sourceType: 'explicit_feedback', origin: 'user_composer', observedAt: now, signal: 'test_signal' }],
    ...overrides,
  };
}

export function ranked(record: PreferenceRecord, reason = 'Test applicability match'): RankedPreference {
  return {
    preference: record,
    score: 9,
    reason,
    scopeMatch: record.scope.domain ? 0.9 : 0.75,
    semanticRelevance: 0.92,
    evidenceConfidence: record.confidence,
    applicability: 0.84,
  };
}
