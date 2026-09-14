import type { PreferenceStore } from './store';
import {
  scopeKey,
  type EvidenceKind,
  type PreferenceEvidence,
  type PreferenceRecord,
  type PreferenceUpdateEvent,
} from './types';

function identifier(): string {
  return globalThis.crypto?.randomUUID?.() ?? `pref-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class PreferenceUpdater {
  constructor(private readonly store: PreferenceStore) {}

  async apply(evidence: PreferenceEvidence): Promise<PreferenceRecord> {
    return (await this.applyDetailed(evidence)).preference;
  }

  async applyDetailed(evidence: PreferenceEvidence): Promise<{ preference: PreferenceRecord; event: PreferenceUpdateEvent }> {
    const records = await this.store.listPreferences();
    const existing = records.find(
      (record) => record.dimension === evidence.dimension && scopeKey(record.scope) === scopeKey(evidence.scope),
    );
    const evidenceKind: EvidenceKind = evidence.evidenceKind
      ?? (evidence.sourceType === 'explicit_feedback' ? 'direct_statement' : 'direct_correction');

    if (!existing) {
      const initialConfidence = evidenceKind === 'direct_statement'
        ? Math.min(0.9, 0.58 + evidence.strength * 0.32)
        : evidenceKind === 'direct_correction'
          ? Math.min(0.34, 0.1 + evidence.strength * 0.25)
          : Math.min(0.28, 0.08 + evidence.strength * 0.2);
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
        lifetime: evidence.lifetime ?? 'durable',
        provenance: [
          {
            id: identifier(),
            sourceType: evidence.sourceType,
            origin: evidence.origin,
            observedAt: evidence.observedAt,
            signal: evidence.signal,
            evidenceKind,
            strength: evidence.strength,
          },
        ],
      };
      await this.store.putPreference(created);
      return {
        preference: created,
        event: {
          preferenceId: created.id,
          dimension: created.dimension,
          scope: created.scope,
          value: created.value,
          confidence: created.confidence,
          evidenceKind,
          signal: evidence.signal,
          status: 'created',
          rationale: evidenceKind === 'direct_statement'
            ? 'Created from a direct, durable preference statement.'
            : 'Recorded cautiously; one correction is not enough to activate a learned preference.',
        },
      };
    }

    if (existing.locked || existing.state === 'locked') {
      return {
        preference: existing,
        event: {
          preferenceId: existing.id,
          dimension: existing.dimension,
          scope: existing.scope,
          previousValue: existing.value,
          value: existing.value,
          previousConfidence: existing.confidence,
          confidence: existing.confidence,
          evidenceKind,
          signal: evidence.signal,
          status: 'locked_conflict',
          rationale: `Ignored ${evidence.value}; the user locked ${existing.value}.`,
        },
      };
    }

    const agrees = existing.value === evidence.value;
    let value = existing.value;
    let confidence = existing.confidence;
    let state = existing.state;
    let conflict = existing.conflict;
    let status: PreferenceUpdateEvent['status'] = 'reinforced';
    let rationale = 'Consistent evidence increased confidence.';

    if (agrees) {
      const repeatedKind = evidenceKind === 'direct_correction' && existing.sourceType === 'implicit_feedback'
        ? 'repeated_correction' as const
        : evidenceKind;
      confidence = Math.min(0.99, confidence + (1 - confidence) * (0.14 + evidence.strength * 0.16));
      state = confidence >= 0.9 && existing.evidenceCount >= 2 ? 'confirmed' : 'inferred';
      conflict = undefined;
      rationale = repeatedKind === 'repeated_correction'
        ? 'A repeated correction crossed the activation threshold.'
        : 'Consistent evidence increased confidence.';
    } else {
      if (evidenceKind === 'direct_statement') {
        value = evidence.value;
        confidence = Math.max(0.84, Math.min(0.94, 0.66 + evidence.strength * 0.28));
        state = 'confirmed';
        conflict = undefined;
        status = 'changed';
        rationale = `The newer direct preference statement superseded ${existing.value}.`;
      } else if (evidenceKind === 'direct_correction' || evidenceKind === 'repeated_correction') {
        value = evidence.value;
        confidence = Math.max(0.72, Math.min(0.82, 0.56 + evidence.strength * 0.2));
        state = 'inferred';
        conflict = undefined;
        status = 'changed';
        rationale = `A direct user correction changed ${existing.value} to ${evidence.value}.`;
      } else {
        const repeatedConflict = existing.conflict?.competingValue === evidence.value
          ? existing.conflict.evidenceCount + 1
          : 1;
        confidence = Math.max(0.2, confidence - evidence.strength * 0.16);
        state = 'ambiguous';
        conflict = {
          competingValue: evidence.value,
          observedAt: evidence.observedAt,
          evidenceKind,
          evidenceCount: repeatedConflict,
          resolution: `Evidence for ${existing.value} and ${evidence.value} conflicts; abstaining until the user clarifies.`,
        };
        status = 'conflict';
        rationale = conflict.resolution;
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
      lifetime: evidence.lifetime ?? existing.lifetime ?? 'durable',
      conflict,
      provenance: [
        ...existing.provenance,
        {
          id: identifier(),
          sourceType: evidence.sourceType,
          origin: evidence.origin,
          observedAt: evidence.observedAt,
          signal: evidence.signal,
          evidenceKind,
          strength: evidence.strength,
        },
      ].slice(-50),
    };
    await this.store.putPreference(updated);
    return {
      preference: updated,
      event: {
        preferenceId: updated.id,
        dimension: updated.dimension,
        scope: updated.scope,
        previousValue: existing.value,
        value: updated.value,
        previousConfidence: existing.confidence,
        confidence: updated.confidence,
        evidenceKind: agrees && evidenceKind === 'direct_correction' && existing.sourceType === 'implicit_feedback'
          ? 'repeated_correction'
          : evidenceKind,
        signal: evidence.signal,
        status,
        rationale,
      },
    };
  }
}
