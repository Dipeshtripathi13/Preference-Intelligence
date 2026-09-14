import type { PreferenceDimension, PreferenceRecord } from './types';

export interface OnboardingPreferenceInput {
  dimension: PreferenceDimension;
  value: string;
  signal: string;
  evidenceKind: 'onboarding_choice' | 'onboarding_import';
}

interface InstructionRule {
  dimension: PreferenceDimension;
  value: string;
  signal: string;
  patterns: readonly RegExp[];
}

const INSTRUCTION_RULES: readonly InstructionRule[] = [
  { dimension: 'verbosity', value: 'concise', signal: 'imported_concise_style', patterns: [/\b(concise|brief|short answers?|keep it short)\b/i] },
  { dimension: 'verbosity', value: 'detailed', signal: 'imported_detailed_style', patterns: [/\b(detailed|thorough|comprehensive) (answers?|responses?|explanations?)\b/i] },
  { dimension: 'format_preference', value: 'bullets', signal: 'imported_bullet_style', patterns: [/\b(bullets?|bullet points?)\b/i] },
  { dimension: 'format_preference', value: 'prose', signal: 'imported_prose_style', patterns: [/\b(prose|paragraphs?|connected prose)\b/i] },
  { dimension: 'code_preference', value: 'preferred', signal: 'imported_code_first_style', patterns: [/\b(code first|prefer code|implementation first)\b/i] },
  { dimension: 'code_preference', value: 'avoid', signal: 'imported_no_code_style', patterns: [/\b(no code|avoid code|prose only)\b/i] },
  { dimension: 'analogy_preference', value: 'preferred', signal: 'imported_analogy_style', patterns: [/\b(use|include|helpful) analog(y|ies)\b/i] },
  { dimension: 'analogy_preference', value: 'avoid', signal: 'imported_no_analogy_style', patterns: [/\b(no|avoid|skip) analog(y|ies)\b/i] },
  { dimension: 'tone', value: 'professional', signal: 'imported_professional_tone', patterns: [/\b(professional|formal) tone\b/i] },
  { dimension: 'tone', value: 'casual', signal: 'imported_casual_tone', patterns: [/\b(casual|conversational) tone\b/i] },
  { dimension: 'citation_preference', value: 'preferred', signal: 'imported_citation_style', patterns: [/\b(include|provide|use|add) (sources|citations|references)\b/i] },
  { dimension: 'answer_first_preference', value: 'answer_first', signal: 'imported_answer_first_style', patterns: [/\b(answer|recommendation|bottom line) first\b/i] },
  { dimension: 'answer_first_preference', value: 'context_first', signal: 'imported_context_first_style', patterns: [/\b(context|explanation) first\b/i] },
  { dimension: 'step_by_step_preference', value: 'preferred', signal: 'imported_stepwise_style', patterns: [/\b(step[- ]by[- ]step|walk me through)\b/i] },
];

/**
 * Parses only allowlisted response-style phrases. The pasted text is never
 * retained; callers persist the resulting bounded declarations only.
 */
export function parseExistingInstructions(text: string): OnboardingPreferenceInput[] {
  const byDimension = new Map<PreferenceDimension, OnboardingPreferenceInput>();
  for (const rule of INSTRUCTION_RULES) {
    if (!rule.patterns.some((pattern) => pattern.test(text))) continue;
    byDimension.set(rule.dimension, {
      dimension: rule.dimension,
      value: rule.value,
      signal: rule.signal,
      evidenceKind: 'onboarding_import',
    });
  }
  return [...byDimension.values()];
}

/** Creates the weaker-than-earned record used by every onboarding client. */
export function createOnboardingRecord(
  selection: OnboardingPreferenceInput,
  observedAt: string,
  identifier: () => string,
): PreferenceRecord {
  return {
    id: identifier(),
    dimension: selection.dimension,
    value: selection.value,
    scope: {},
    confidence: 0.5,
    evidenceCount: 1,
    createdAt: observedAt,
    updatedAt: observedAt,
    lastObservedAt: observedAt,
    sourceType: 'onboarding_declaration',
    state: 'inferred',
    locked: false,
    enabled: true,
    decayRate: 0.005,
    lifetime: 'durable',
    provenance: [{
      id: identifier(),
      sourceType: 'onboarding_declaration',
      origin: 'onboarding',
      observedAt,
      signal: selection.signal,
      evidenceKind: selection.evidenceKind,
      strength: 0.5,
    }],
  };
}
