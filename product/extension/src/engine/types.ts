export const DOMAINS = [
  'software_engineering',
  'machine_learning',
  'science',
  'finance',
  'legal',
  'health',
  'education',
  'professional_writing',
  'creative_writing',
  'general',
] as const;

export type Domain = (typeof DOMAINS)[number];

export const TASKS = [
  'explanation',
  'implementation',
  'debugging',
  'comparison',
  'summarization',
  'writing',
  'calculation',
  'general',
] as const;

export type Task = (typeof TASKS)[number];

export const DIMENSIONS = [
  'verbosity',
  'technical_depth',
  'explanation_level',
  'code_preference',
  'example_preference',
  'analogy_preference',
  'format_preference',
  'step_by_step_preference',
  'tone',
  'math_depth',
  'citation_preference',
  'answer_first_preference',
] as const;

export type PreferenceDimension = (typeof DIMENSIONS)[number];

export const VALUES_BY_DIMENSION: Record<PreferenceDimension, readonly string[]> = {
  verbosity: ['concise', 'medium', 'detailed'],
  technical_depth: ['beginner', 'intermediate', 'advanced'],
  explanation_level: ['minimal', 'foundational', 'thorough'],
  code_preference: ['avoid', 'when_useful', 'preferred'],
  example_preference: ['avoid', 'when_useful', 'preferred'],
  analogy_preference: ['avoid', 'when_useful', 'preferred'],
  format_preference: ['prose', 'bullets', 'structured'],
  step_by_step_preference: ['avoid', 'when_useful', 'preferred'],
  tone: ['casual', 'neutral', 'professional'],
  math_depth: ['minimal', 'moderate', 'rigorous'],
  citation_preference: ['avoid', 'when_available', 'preferred'],
  answer_first_preference: ['context_first', 'balanced', 'answer_first'],
};

export type PreferenceSource =
  | 'explicit_feedback'
  | 'implicit_feedback'
  | 'user_edit'
  | 'profile_import';

export type PreferenceState = 'inferred' | 'confirmed' | 'locked' | 'suppressed' | 'ambiguous';

export type TrustedOrigin = 'user_composer' | 'dashboard' | 'profile_import';
export type UntrustedOrigin = 'assistant_message' | 'webpage_content';

export interface Scope {
  domain?: Domain;
  subdomain?: string;
  task?: Task;
}

export interface ClassifiedContext {
  domain: Domain;
  subdomain?: string;
  task: Task;
  confidence: number;
  method?: 'deterministic_rules' | 'abstained';
  /** Ranked domain candidates for multi-domain inspection; the first is primary. */
  domains?: Array<{ domain: Domain; subdomain?: string; confidence: number }>;
}

export type EvidenceKind =
  | 'direct_statement'
  | 'direct_correction'
  | 'repeated_correction'
  | 'interaction_pattern'
  | 'dashboard_edit'
  | 'imported';

export type PreferenceLifetime = 'current_request' | 'session' | 'temporary' | 'durable' | 'locked';

export interface PreferenceProvenance {
  id: string;
  sourceType: PreferenceSource;
  origin: TrustedOrigin;
  observedAt: string;
  /** A bounded signal label, never raw chat or webpage text. */
  signal: string;
  evidenceKind?: EvidenceKind;
  strength?: number;
  polarity?: 'positive' | 'negative';
  scope?: Scope;
}

export interface PreferenceConflict {
  competingValue: string;
  observedAt: string;
  evidenceKind: EvidenceKind;
  evidenceCount: number;
  resolution: string;
}

export interface PreferenceRecord {
  id: string;
  dimension: PreferenceDimension;
  value: string;
  scope: Scope;
  confidence: number;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
  lastObservedAt: string;
  sourceType: PreferenceSource;
  state: PreferenceState;
  locked: boolean;
  enabled: boolean;
  decayRate: number;
  /** Missing on pre-0.2 local records and interpreted as durable. */
  lifetime?: Exclude<PreferenceLifetime, 'current_request'>;
  expiresAt?: string;
  conflict?: PreferenceConflict;
  /** User-authored applicability corrections; the preference itself remains intact. */
  notApplicableTo?: Scope[];
  provenance: PreferenceProvenance[];
}

export interface PreferenceEvidence {
  dimension: PreferenceDimension;
  value: string;
  scope: Scope;
  strength: number;
  sourceType: 'explicit_feedback' | 'implicit_feedback';
  origin: TrustedOrigin;
  observedAt: string;
  signal: string;
  evidenceKind?: Exclude<EvidenceKind, 'dashboard_edit' | 'imported'>;
  lifetime?: 'durable' | 'session' | 'temporary';
}

export interface ExtractionInput {
  text: string;
  context: ClassifiedContext;
  origin: TrustedOrigin | UntrustedOrigin;
  isTrustedUserAction: boolean;
}

export interface RankedPreference {
  preference: PreferenceRecord;
  score: number;
  reason: string;
  scopeMatch: number;
  semanticRelevance: number;
  evidenceConfidence: number;
  applicability: number;
}

export type UsageDecisionStatus =
  | 'used'
  | 'overridden_by_current_prompt'
  | 'suppressed_scope'
  | 'suppressed_applicability'
  | 'suppressed_conflict'
  | 'suppressed_confidence'
  | 'suppressed_disabled'
  | 'suppressed_condition'
  | 'suppressed_expired'
  | 'suppressed_by_more_specific'
  | 'suppressed_budget';

export interface UsageDecision {
  preferenceId: string;
  dimension: PreferenceDimension;
  value: string;
  scope: Scope;
  confidence: number;
  status: UsageDecisionStatus;
  reason: string;
  scopeMatch: number;
  semanticRelevance: number;
  evidenceConfidence: number;
  applicability: number;
  evidenceCount: number;
  lastObservedAt: string;
  sourceType: PreferenceSource;
  state: PreferenceState;
  lifetime: PreferenceLifetime;
}

export interface PreferenceUpdateEvent {
  preferenceId: string;
  dimension: PreferenceDimension;
  scope: Scope;
  previousValue?: string;
  value: string;
  previousConfidence?: number;
  confidence: number;
  evidenceKind: EvidenceKind;
  signal: string;
  status: 'created' | 'reinforced' | 'changed' | 'conflict' | 'locked_conflict';
  rationale: string;
}

export interface CompiledContext {
  instruction: string;
  selected: RankedPreference[];
  decisions: UsageDecision[];
  classification: ClassifiedContext;
  estimatedTokens: number;
  updates: PreferenceUpdateEvent[];
}

export type ExperimentCondition =
  | 'no_personalization'
  | 'static_profile'
  | 'global_learned'
  | 'domain_conditioned';

export interface ProductSettings {
  learningEnabled: boolean;
  personalizationEnabled: boolean;
  disabledDomains: Domain[];
  experimentalMode: boolean;
  experimentCondition: ExperimentCondition;
  recordRawPrompts: boolean;
}

export interface UsageLog {
  id: string;
  timestamp: string;
  provider: string;
  classification: ClassifiedContext;
  decisions: UsageDecision[];
  updates: PreferenceUpdateEvent[];
  experimentCondition: ExperimentCondition;
  estimatedTokens: number;
  rawPrompt?: string;
  compiledInstruction?: string;
}

export const DEFAULT_SETTINGS: ProductSettings = {
  learningEnabled: true,
  personalizationEnabled: true,
  disabledDomains: [],
  experimentalMode: false,
  experimentCondition: 'domain_conditioned',
  recordRawPrompts: false,
};

export function isAllowedValue(dimension: PreferenceDimension, value: string): boolean {
  return VALUES_BY_DIMENSION[dimension].includes(value);
}

export function scopeKey(scope: Scope): string {
  return `${scope.domain ?? '*'}::${scope.subdomain ?? '*'}::${scope.task ?? '*'}`;
}
