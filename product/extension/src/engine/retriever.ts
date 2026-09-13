import type { PreferenceStore } from './store';
import type {
  ClassifiedContext,
  ExperimentCondition,
  PreferenceRecord,
  RankedPreference,
} from './types';

function matches(record: PreferenceRecord, context: ClassifiedContext): boolean {
  if (!record.scope.domain) return true;
  if (record.scope.domain !== context.domain) return false;
  if (record.scope.subdomain && record.scope.subdomain !== context.subdomain) return false;
  if (record.scope.task && record.scope.task !== context.task) return false;
  return true;
}

function specificity(record: PreferenceRecord): number {
  return (record.scope.domain ? 1 : 0) + (record.scope.subdomain ? 1 : 0) + (record.scope.task ? 1 : 0);
}

function effectiveConfidence(record: PreferenceRecord, now: Date): number {
  if (record.locked || record.state === 'locked' || record.state === 'confirmed') return record.confidence;
  const ageDays = Math.max(0, now.getTime() - new Date(record.lastObservedAt).getTime()) / 86_400_000;
  return record.confidence * Math.exp(-record.decayRate * ageDays);
}

function allowedByCondition(record: PreferenceRecord, condition: ExperimentCondition): boolean {
  switch (condition) {
    case 'no_personalization':
      return false;
    case 'static_profile':
      return record.sourceType === 'user_edit' || record.sourceType === 'profile_import';
    case 'global_learned':
      return !record.scope.domain;
    case 'domain_conditioned':
      return true;
  }
}

export class PreferenceRetriever {
  constructor(private readonly store: PreferenceStore) {}

  async retrieve(
    context: ClassifiedContext,
    condition: ExperimentCondition = 'domain_conditioned',
    now = new Date(),
  ): Promise<RankedPreference[]> {
    const settings = await this.store.getSettings();
    if (!settings.personalizationEnabled || settings.disabledDomains.includes(context.domain)) return [];

    const candidates = (await this.store.listPreferences())
      .filter((record) => record.enabled && record.state !== 'suppressed' && matches(record, context))
      .filter((record) => allowedByCondition(record, condition))
      .map((record) => {
        const confidence = effectiveConfidence(record, now);
        const specificityScore = specificity(record);
        const authority = record.locked || record.state === 'locked' ? 40 : record.state === 'confirmed' ? 20 : 0;
        return {
          preference: record,
          score: specificityScore * 100 + authority + confidence * 10,
          reason: `${specificityScore === 0 ? 'Global fallback' : `Matching scope (${specificityScore} level${specificityScore === 1 ? '' : 's'})`}; ${Math.round(confidence * 100)}% effective confidence`,
        };
      })
      .filter(({ preference }) => preference.locked || effectiveConfidence(preference, now) >= 0.35)
      .sort((left, right) => right.score - left.score);

    const selected = new Map<string, RankedPreference>();
    for (const candidate of candidates) {
      if (!selected.has(candidate.preference.dimension)) {
        selected.set(candidate.preference.dimension, candidate);
      }
    }
    return [...selected.values()].sort((left, right) => right.score - left.score);
  }
}
