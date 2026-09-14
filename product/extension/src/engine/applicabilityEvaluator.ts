import type {
  ClassifiedContext,
  PreferenceDimension,
  PreferenceRecord,
} from './types';

export const APPLICABILITY_THRESHOLD = 0.72;

export interface ApplicabilityAssessment {
  scopeMatch: number;
  semanticRelevance: number;
  evidenceConfidence: number;
  applicability: number;
  applicable: boolean;
  reason: string;
}

function rounded(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function semanticRelevance(dimension: PreferenceDimension, context: ClassifiedContext): number {
  if (context.method === 'abstained' && ['technical_depth', 'explanation_level', 'code_preference', 'math_depth'].includes(dimension)) {
    return 0.2;
  }
  if (dimension === 'code_preference') {
    return context.domain === 'software_engineering' || context.domain === 'machine_learning'
      || context.task === 'implementation' || context.task === 'debugging' ? 0.98 : 0.3;
  }
  if (dimension === 'math_depth') {
    return context.domain === 'finance' || context.domain === 'science'
      || context.domain === 'machine_learning' || context.task === 'calculation' ? 0.96 : 0.38;
  }
  if (dimension === 'technical_depth') {
    return ['software_engineering', 'machine_learning', 'science', 'finance', 'legal', 'health']
      .includes(context.domain) ? 0.95 : 0.7;
  }
  if (dimension === 'explanation_level' || dimension === 'example_preference'
    || dimension === 'analogy_preference' || dimension === 'step_by_step_preference') {
    return ['explanation', 'implementation', 'debugging', 'comparison', 'calculation']
      .includes(context.task) ? 0.94 : 0.76;
  }
  return 0.92;
}

function scopeAssessment(record: PreferenceRecord, context: ClassifiedContext): { score: number; matches: boolean; reason: string } {
  if (record.scope.domain && record.scope.domain !== context.domain) {
    const storedScope = record.scope.subdomain
      ? `${record.scope.subdomain} (${record.scope.domain})`
      : record.scope.domain;
    return { score: 0, matches: false, reason: `Stored for ${storedScope}; this request is ${context.subdomain ? `${context.subdomain} (${context.domain})` : context.domain}.` };
  }
  if (record.scope.subdomain && record.scope.subdomain !== context.subdomain) {
    return { score: 0, matches: false, reason: `Stored for ${record.scope.subdomain}; this request is ${context.subdomain ?? 'outside that subdomain'}.` };
  }
  if (record.scope.task && record.scope.task !== context.task) {
    return { score: 0, matches: false, reason: `Stored for ${record.scope.task} tasks; this request is ${context.task}.` };
  }

  if (record.scope.task) return { score: 1, matches: true, reason: 'Exact task scope match.' };
  if (record.scope.subdomain) return { score: 0.98, matches: true, reason: 'Exact subdomain scope match.' };
  if (record.scope.domain) return { score: 0.9, matches: true, reason: 'Domain scope match.' };
  return { score: 0.75, matches: true, reason: 'Global preference candidate.' };
}

/** Applicability is a hard eligibility gate. Ranking cannot make an irrelevant preference eligible. */
export class ApplicabilityEvaluator {
  evaluate(
    record: PreferenceRecord,
    context: ClassifiedContext,
    evidenceConfidence = record.confidence,
  ): ApplicabilityAssessment {
    const scope = scopeAssessment(record, context);
    const relevance = semanticRelevance(record.dimension, context);
    const applicability = rounded(scope.score * 0.45 + relevance * 0.25 + evidenceConfidence * 0.3);

    if (!scope.matches) {
      return {
        scopeMatch: scope.score,
        semanticRelevance: relevance,
        evidenceConfidence: rounded(evidenceConfidence),
        applicability,
        applicable: false,
        reason: scope.reason,
      };
    }
    if (applicability < APPLICABILITY_THRESHOLD) {
      return {
        scopeMatch: scope.score,
        semanticRelevance: relevance,
        evidenceConfidence: rounded(evidenceConfidence),
        applicability,
        applicable: false,
        reason: `${record.dimension} is weakly relevant to this request (${Math.round(relevance * 100)}% semantic relevance).`,
      };
    }
    return {
      scopeMatch: scope.score,
      semanticRelevance: relevance,
      evidenceConfidence: rounded(evidenceConfidence),
      applicability,
      applicable: true,
      reason: `${scope.reason} Applicability ${Math.round(applicability * 100)}%.`,
    };
  }
}
