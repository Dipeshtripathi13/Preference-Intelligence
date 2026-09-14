import { ApplicabilityEvaluator } from './applicabilityEvaluator';
import type { PreferenceStore } from './store';
import type {
  ClassifiedContext,
  ExperimentCondition,
  PreferenceLifetime,
  PreferenceRecord,
  RankedPreference,
  Scope,
  UsageDecision,
  UsageDecisionStatus,
} from './types';

function specificity(record: PreferenceRecord): number {
  return (record.scope.domain ? 1 : 0) + (record.scope.subdomain ? 1 : 0) + (record.scope.task ? 1 : 0);
}

export function effectiveConfidence(record: PreferenceRecord, now: Date): number {
  if (record.locked || record.state === 'locked' || record.state === 'confirmed') return record.confidence;
  const ageDays = Math.max(0, now.getTime() - new Date(record.lastObservedAt).getTime()) / 86_400_000;
  return record.confidence * Math.exp(-record.decayRate * ageDays);
}

function lifetime(record: PreferenceRecord): PreferenceLifetime {
  return record.locked || record.state === 'locked' ? 'locked' : record.lifetime ?? 'durable';
}

function userExcludedContext(record: PreferenceRecord, context: ClassifiedContext): Scope | undefined {
  return record.notApplicableTo?.find((scope) =>
    (!scope.domain || scope.domain === context.domain)
    && (!scope.subdomain || scope.subdomain === context.subdomain)
    && (!scope.task || scope.task === context.task));
}

function decision(
  record: PreferenceRecord,
  status: UsageDecisionStatus,
  reason: string,
  scores = { scopeMatch: 0, semanticRelevance: 0, evidenceConfidence: record.confidence, applicability: 0 },
): UsageDecision {
  return {
    preferenceId: record.id,
    dimension: record.dimension,
    value: record.value,
    scope: record.scope,
    confidence: record.confidence,
    status,
    reason,
    ...scores,
    evidenceCount: record.evidenceCount,
    lastObservedAt: record.lastObservedAt,
    sourceType: record.sourceType,
    state: record.state,
    lifetime: lifetime(record),
  };
}

export interface RetrievalResult {
  selected: RankedPreference[];
  decisions: UsageDecision[];
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
  private readonly applicability = new ApplicabilityEvaluator();

  constructor(private readonly store: PreferenceStore) {}

  async evaluate(
    context: ClassifiedContext,
    condition: ExperimentCondition = 'domain_conditioned',
    now = new Date(),
  ): Promise<RetrievalResult> {
    const settings = await this.store.getSettings();
    const records = await this.store.listPreferences();
    const decisions: UsageDecision[] = [];
    const candidates: RankedPreference[] = [];

    for (const record of records) {
      const confidence = effectiveConfidence(record, now);
      const assessment = this.applicability.evaluate(record, context, confidence);
      const scores = {
        scopeMatch: assessment.scopeMatch,
        semanticRelevance: assessment.semanticRelevance,
        evidenceConfidence: assessment.evidenceConfidence,
        applicability: assessment.applicability,
      };

      if (!settings.personalizationEnabled) {
        decisions.push(decision(record, 'suppressed_disabled', 'Personalization is turned off.', scores));
        continue;
      }
      if (settings.disabledDomains.includes(context.domain)) {
        decisions.push(decision(record, 'suppressed_disabled', `Personalization is disabled for ${context.domain}.`, scores));
        continue;
      }
      if (!record.enabled || record.state === 'suppressed') {
        decisions.push(decision(record, 'suppressed_disabled', 'This preference is disabled.', scores));
        continue;
      }
      if (!allowedByCondition(record, condition)) {
        decisions.push(decision(record, 'suppressed_condition', `Excluded by the ${condition} experimental condition.`, scores));
        continue;
      }
      if (record.expiresAt && new Date(record.expiresAt).getTime() <= now.getTime()) {
        decisions.push(decision(record, 'suppressed_expired', `Temporary preference expired ${record.expiresAt}.`, scores));
        continue;
      }
      if (record.state === 'ambiguous' || record.conflict) {
        decisions.push(decision(
          record,
          'suppressed_conflict',
          record.conflict?.resolution ?? 'Conflicting evidence is unresolved; the system abstained.',
          scores,
        ));
        continue;
      }
      if (userExcludedContext(record, context)) {
        decisions.push(decision(
          record,
          'suppressed_applicability',
          `The user marked this preference as not relevant for ${context.subdomain ?? context.domain} ${context.task} requests.`,
          scores,
        ));
        continue;
      }
      if (assessment.scopeMatch === 0) {
        decisions.push(decision(record, 'suppressed_scope', assessment.reason, scores));
        continue;
      }
      if (!record.locked && record.state !== 'locked' && confidence < 0.35) {
        decisions.push(decision(record, 'suppressed_confidence', `Evidence confidence ${Math.round(confidence * 100)}% is below the 35% activation threshold.`, scores));
        continue;
      }
      if (!assessment.applicable) {
        decisions.push(decision(record, 'suppressed_applicability', assessment.reason, scores));
        continue;
      }

      const specificityScore = specificity(record);
      const authority = record.locked || record.state === 'locked' ? 40 : record.state === 'confirmed' ? 20 : 0;
      candidates.push({
        preference: record,
        score: specificityScore * 100 + authority + assessment.applicability * 10,
        reason: `${assessment.reason} Evidence confidence ${Math.round(confidence * 100)}%.`,
        ...scores,
      });
    }

    candidates.sort((left, right) => right.score - left.score);

    const selected = new Map<string, RankedPreference>();
    for (const candidate of candidates) {
      const prior = selected.get(candidate.preference.dimension);
      if (!prior) {
        selected.set(candidate.preference.dimension, candidate);
        continue;
      }
      decisions.push(decision(
        candidate.preference,
        'suppressed_by_more_specific',
        `A more specific ${prior.preference.dimension} preference (${prior.preference.value}) takes precedence.`,
        candidate,
      ));
    }

    return {
      selected: [...selected.values()].sort((left, right) => right.score - left.score),
      decisions: decisions.slice(0, 50),
    };
  }

  async retrieve(
    context: ClassifiedContext,
    condition: ExperimentCondition = 'domain_conditioned',
    now = new Date(),
  ): Promise<RankedPreference[]> {
    return (await this.evaluate(context, condition, now)).selected;
  }
}
