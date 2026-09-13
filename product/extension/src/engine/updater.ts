import type { PreferenceStore } from './store';
import { scopeKey, type PreferenceEvidence, type PreferenceRecord } from './types';

function identifier(): string {
  return globalThis.crypto?.randomUUID?.() ?? `pref-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class PreferenceUpdater {
  constructor(private readonly store: PreferenceStore) {}

  async apply(evidence: PreferenceEvidence): Promise<PreferenceRecord> {
    const records = await this.store.listPreferences();
    const existing = records.find(
      (record) => record.dimension === evidence.dimension && scopeKey(record.scope) === scopeKey(evidence.scope),
    );

    if (!existing) {
      const initialConfidence = evidence.sourceType === 'implicit_feedback'
        ? Math.min(0.34, 0.1 + evidence.strength * 0.25)
        : Math.min(0.9, 0.58 + evidence.strength * 0.32);
      const created: PreferenceRecord = {
        id: identifier(),
        dimension: evidence.dimension,
        value: evidence.value,
        scope: evidence.scope,
        confidence: initialConfidence,
        evidenceCount: 1,
        createdAt: evidence.observedAt,
        updatedAt: evidence.observedAt,
        lastObservedAt: evidence.observedAt,
        sourceType: evidence.sourceType,
        state: 'inferred',
        locked: false,
        enabled: true,
        decayRate: evidence.sourceType === 'explicit_feedback' ? 0.002 : 0.01,
        provenance: [
          {
            id: identifier(),
            sourceType: evidence.sourceType,
            origin: evidence.origin,
            observedAt: evidence.observedAt,
            signal: evidence.signal,
          },
        ],
      };
      await this.store.putPreference(created);
      return created;
    }

    if (existing.locked || existing.state === 'locked') return existing;

    const agrees = existing.value === evidence.value;
    let value = existing.value;
    let confidence = existing.confidence;
    let state = existing.state;

    if (agrees) {
      confidence = Math.min(0.99, confidence + (1 - confidence) * (0.12 + evidence.strength * 0.18));
      state = confidence >= 0.9 && existing.evidenceCount >= 2 ? 'confirmed' : 'inferred';
    } else {
      const opposition = evidence.strength * 0.55;
      if (opposition > confidence * 0.65) {
        value = evidence.value;
        confidence = Math.min(0.85, 0.5 + (opposition - confidence * 0.65));
        state = 'ambiguous';
      } else {
        confidence = Math.max(0.2, confidence - opposition * 0.4);
        state = 'ambiguous';
      }
    }

    const updated: PreferenceRecord = {
      ...existing,
      value,
      confidence,
      state,
      evidenceCount: existing.evidenceCount + 1,
      updatedAt: evidence.observedAt,
      lastObservedAt: evidence.observedAt,
      sourceType: evidence.sourceType,
      provenance: [
        ...existing.provenance,
        {
          id: identifier(),
          sourceType: evidence.sourceType,
          origin: evidence.origin,
          observedAt: evidence.observedAt,
          signal: evidence.signal,
        },
      ].slice(-50),
    };
    await this.store.putPreference(updated);
    return updated;
  }
}
