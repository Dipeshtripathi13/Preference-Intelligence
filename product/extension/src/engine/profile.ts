import type { PreferenceStore } from './store';
import {
  DIMENSIONS,
  DOMAINS,
  isAllowedValue,
  type Domain,
  type PreferenceDimension,
  type PreferenceRecord,
  type PreferenceSource,
  type PreferenceState,
  type Scope,
  type Task,
  TASKS,
} from './types';

interface CanonicalScope {
  domain: string | null;
  subdomain: string | null;
  task: string | null;
}

interface CanonicalEvidence {
  evidence_id: string;
  event_id: string;
  author: 'user';
  polarity: 'positive' | 'negative';
  explicitness: 'explicit' | 'correction' | 'implicit';
  strength: number;
  source_type: CanonicalSource;
  signal_label: string | null;
  raw_excerpt: null;
  observed_at: string;
  scope_at_observation: CanonicalScope;
  capture: {
    mechanism: 'onboarding' | 'dashboard' | 'provider_composer' | 'profile_import';
    provider: null;
    trusted_user_surface: true;
  };
}

type CanonicalSource = 'onboarding_declaration' | 'dashboard_edit' | 'user_explicit' | 'user_correction' | 'user_implicit' | 'imported' | 'experiment';

interface CanonicalPreference {
  preference_id: string;
  dimension: PreferenceDimension;
  value: string;
  scope?: CanonicalScope;
  confidence: number;
  state: PreferenceState;
  source_type: CanonicalSource;
  evidence_count: number;
  independent_interaction_count: number;
  created_at: string;
  updated_at: string;
  last_observed_at: string;
  expires_at: string | null;
  decay: { mode: 'exponential' | 'none'; half_life_days: number | null };
  user_locked: boolean;
  evidence: CanonicalEvidence[];
  provenance: Array<{
    actor: 'user' | 'local_inference' | 'import';
    component: string;
    version: string;
    recorded_at: string;
  }>;
}

export interface CanonicalProfile {
  schema_version: '0.1.0';
  profile_id: string;
  created_at: string;
  updated_at: string;
  generator: { name: 'Preference Intelligence Extension'; version: '0.2.0' };
  settings: {
    learning_enabled: boolean;
    raw_evidence_included: false;
    disabled_scopes: CanonicalScope[];
  };
  preferences: CanonicalPreference[];
}

function uuid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `00000000-0000-4000-8000-${Date.now().toString().padStart(12, '0').slice(-12)}`;
}

function canonicalScope(scope: Scope): CanonicalScope {
  return { domain: scope.domain ?? null, subdomain: scope.subdomain ?? null, task: scope.task ?? null };
}

function canonicalSource(source: PreferenceSource): CanonicalSource {
  return {
    explicit_feedback: 'user_explicit',
    implicit_feedback: 'user_implicit',
    onboarding_declaration: 'onboarding_declaration',
    user_edit: 'dashboard_edit',
    profile_import: 'imported',
  }[source] as CanonicalSource;
}

function exportPreference(record: PreferenceRecord): CanonicalPreference {
  const source = canonicalSource(record.sourceType);
  const scope = canonicalScope(record.scope);
  return {
    preference_id: record.id,
    dimension: record.dimension,
    value: record.value,
    scope,
    confidence: record.confidence,
    state: record.enabled ? (record.locked ? 'locked' : record.state) : 'suppressed',
    source_type: source,
    evidence_count: record.evidenceCount,
    independent_interaction_count: record.evidenceCount,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    last_observed_at: record.lastObservedAt,
    expires_at: record.expiresAt ?? null,
    decay: record.locked || record.decayRate === 0
      ? { mode: 'none', half_life_days: null }
      : { mode: 'exponential', half_life_days: Math.log(2) / record.decayRate },
    user_locked: record.locked,
    evidence: record.provenance.map((item) => ({
      evidence_id: validUuid(item.id) ? item.id : uuid(),
      event_id: item.id,
      author: 'user',
      polarity: item.polarity ?? 'positive',
      explicitness: item.evidenceKind === 'direct_correction' || item.evidenceKind === 'repeated_correction'
        ? 'correction'
        : item.sourceType === 'implicit_feedback' ? 'implicit' : 'explicit',
      strength: item.strength ?? record.confidence,
      source_type: canonicalSource(item.sourceType),
      signal_label: item.signal,
      raw_excerpt: null,
      observed_at: item.observedAt,
      scope_at_observation: canonicalScope(item.scope ?? record.scope),
      capture: {
        mechanism: item.origin === 'onboarding' ? 'onboarding' : item.origin === 'dashboard' ? 'dashboard' : item.origin === 'profile_import' ? 'profile_import' : 'provider_composer',
        provider: null,
        trusted_user_surface: true,
      },
    })),
    provenance: [{
      actor: record.sourceType === 'user_edit' || record.sourceType === 'onboarding_declaration'
        ? 'user' : record.sourceType === 'profile_import' ? 'import' : 'local_inference',
      component: 'preference-intelligence-extension',
      version: '0.2.0',
      recorded_at: record.updatedAt,
    }],
  };
}

export async function exportProfile(store: PreferenceStore): Promise<CanonicalProfile> {
  const now = new Date().toISOString();
  const settings = await store.getSettings();
  return {
    schema_version: '0.1.0',
    profile_id: uuid(),
    created_at: now,
    updated_at: now,
    generator: { name: 'Preference Intelligence Extension', version: '0.2.0' },
    settings: {
      learning_enabled: settings.learningEnabled,
      raw_evidence_included: false,
      disabled_scopes: settings.disabledDomains.map((domain) => ({ domain, subdomain: null, task: null })),
    },
    preferences: (await store.listPreferences()).map(exportPreference),
  };
}

function object(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateScope(value: unknown): asserts value is CanonicalScope {
  if (!object(value)) throw new Error('Preference scope is required.');
  if (value.domain !== null && !DOMAINS.includes(value.domain)) throw new Error('Unsupported domain.');
  if (value.subdomain !== null && (typeof value.subdomain !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/.test(value.subdomain))) throw new Error('Invalid subdomain.');
  if (value.task !== null && !TASKS.includes(value.task)) throw new Error('Unsupported task.');
}

function validatePreference(value: unknown): asserts value is CanonicalPreference {
  if (!object(value)) throw new Error('Each preference must be an object.');
  if (!DIMENSIONS.includes(value.dimension)) throw new Error(`Unsupported preference dimension: ${String(value.dimension)}`);
  if (typeof value.value !== 'string' || !isAllowedValue(value.dimension, value.value)) {
    throw new Error(`Unsupported value for ${value.dimension}.`);
  }
  if (value.scope !== undefined) validateScope(value.scope);
  if (typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) throw new Error('Invalid confidence.');
  if (!validUuid(value.preference_id)) throw new Error('Invalid preference id.');
  if (!validDate(value.created_at) || !validDate(value.updated_at) || !validDate(value.last_observed_at)) throw new Error('Invalid preference timestamp.');
  if (value.expires_at !== undefined && value.expires_at !== null && !validDate(value.expires_at)) throw new Error('Invalid expiration timestamp.');
  if (!['inferred', 'confirmed', 'locked', 'suppressed', 'ambiguous'].includes(value.state)) throw new Error('Invalid preference state.');
  if (!['onboarding_declaration', 'dashboard_edit', 'user_explicit', 'user_correction', 'user_implicit', 'imported', 'experiment'].includes(value.source_type)) throw new Error('Invalid preference source.');
  if (!Number.isInteger(value.evidence_count) || value.evidence_count < 0) throw new Error('Invalid evidence count.');
  if (typeof value.user_locked !== 'boolean') throw new Error('Invalid lock state.');
  if (!object(value.decay) || !['none', 'exponential'].includes(value.decay.mode)) throw new Error('Invalid decay policy.');
  if (value.decay.mode === 'exponential' && (typeof value.decay.half_life_days !== 'number' || value.decay.half_life_days <= 0)) throw new Error('Invalid decay half-life.');
  if (!Array.isArray(value.evidence) || value.evidence.length > 1000) throw new Error('Invalid evidence list.');
  if (!Array.isArray(value.provenance) || value.provenance.length === 0 || value.provenance.length > 100) throw new Error('Invalid provenance list.');
  for (const item of value.evidence) {
    if (!object(item) || !validUuid(item.evidence_id) || typeof item.event_id !== 'string'
      || item.author !== 'user' || !['positive', 'negative'].includes(item.polarity)
      || !['explicit', 'correction', 'implicit'].includes(item.explicitness)
      || typeof item.strength !== 'number' || item.strength < 0 || item.strength > 1
      || !['onboarding_declaration', 'dashboard_edit', 'user_explicit', 'user_correction', 'user_implicit', 'imported', 'experiment'].includes(item.source_type)
      || !validDate(item.observed_at) || !object(item.capture) || item.capture.trusted_user_surface !== true
      || !['onboarding', 'dashboard', 'provider_composer', 'profile_import', 'synthetic_experiment'].includes(item.capture.mechanism)) {
      throw new Error('Invalid evidence record.');
    }
    validateScope(item.scope_at_observation);
  }
  for (const item of value.provenance) {
    if (!object(item) || !['user', 'local_inference', 'import'].includes(item.actor)
      || typeof item.component !== 'string' || !validDate(item.recorded_at)) throw new Error('Invalid provenance record.');
  }
}

export function parseProfile(input: unknown): { records: PreferenceRecord[]; disabledDomains: Domain[]; learningEnabled: boolean } {
  if (!object(input) || input.schema_version !== '0.1.0') throw new Error('Unsupported profile schema version.');
  if (!validUuid(input.profile_id) || !validDate(input.created_at) || !validDate(input.updated_at)) throw new Error('Invalid profile metadata.');
  if (!object(input.generator) || typeof input.generator.name !== 'string' || typeof input.generator.version !== 'string') throw new Error('Invalid profile generator.');
  if (!Array.isArray(input.preferences) || input.preferences.length > 5000) throw new Error('Invalid preference list.');
  if (!object(input.settings) || !Array.isArray(input.settings.disabled_scopes)) throw new Error('Invalid profile settings.');
  if (input.settings.disabled_scopes.length > 100 || typeof input.settings.learning_enabled !== 'boolean'
    || typeof input.settings.raw_evidence_included !== 'boolean') throw new Error('Invalid profile settings.');

  const records = input.preferences.map((raw) => {
    validatePreference(raw);
    const canonical = raw.scope ?? { domain: null, subdomain: null, task: null };
    const scope: Scope = {
      domain: (canonical.domain ?? undefined) as Domain | undefined,
      subdomain: canonical.subdomain ?? undefined,
      task: (canonical.task ?? undefined) as Task | undefined,
    };
    const signal = raw.evidence?.[0]?.signal_label ?? 'imported_profile_record';
    const applicabilityCorrections = raw.evidence
      .filter((item) => item.polarity === 'negative' && item.signal_label === 'not_applicable_for_context')
      .map((item) => ({
        domain: (item.scope_at_observation.domain ?? undefined) as Domain | undefined,
        subdomain: item.scope_at_observation.subdomain ?? undefined,
        task: (item.scope_at_observation.task ?? undefined) as Task | undefined,
      }));
    return {
      id: raw.preference_id,
      dimension: raw.dimension,
      value: raw.value,
      scope,
      confidence: raw.confidence,
      evidenceCount: raw.evidence_count,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      lastObservedAt: raw.last_observed_at,
      sourceType: 'profile_import' as const,
      state: raw.user_locked ? 'locked' as const : raw.state,
      locked: raw.user_locked,
      enabled: raw.state !== 'suppressed',
      lifetime: raw.user_locked ? 'locked' as const : raw.expires_at ? 'temporary' as const : 'durable' as const,
      expiresAt: raw.expires_at ?? undefined,
      notApplicableTo: applicabilityCorrections.length ? applicabilityCorrections : undefined,
      decayRate: raw.decay?.mode === 'exponential' && raw.decay.half_life_days
        ? Math.log(2) / raw.decay.half_life_days
        : 0,
      provenance: [{
        id: uuid(),
        sourceType: 'profile_import' as const,
        origin: 'profile_import' as const,
        observedAt: new Date().toISOString(),
        signal: typeof signal === 'string' ? signal.slice(0, 120) : 'imported_profile_record',
        evidenceKind: 'imported' as const,
        strength: raw.confidence,
      }],
    } satisfies PreferenceRecord;
  });

  const disabledDomains = input.settings.disabled_scopes
    .map((scope: unknown) => {
      validateScope(scope);
      if (typeof scope.domain !== 'string' || !DOMAINS.includes(scope.domain as Domain)) {
        throw new Error('Unsupported disabled scope.');
      }
      return scope.domain as Domain;
    });

  if (new Set(records.map((record) => record.id)).size !== records.length) throw new Error('Duplicate preference id.');

  return {
    records,
    disabledDomains: [...new Set(disabledDomains)],
    learningEnabled: input.settings.learning_enabled !== false,
  };
}

export async function importProfile(store: PreferenceStore, input: unknown, replace = false): Promise<number> {
  const parsed = parseProfile(input);
  if (replace) await store.clearPreferences();
  let imported = 0;
  for (const record of parsed.records) {
    const existing = replace ? undefined : await store.getPreference(record.id);
    if (existing?.locked || existing?.state === 'locked') continue;
    await store.putPreference(record);
    imported += 1;
  }
  const settings = await store.getSettings();
  await store.putSettings({
    ...settings,
    learningEnabled: parsed.learningEnabled,
    disabledDomains: [...new Set([...settings.disabledDomains, ...parsed.disabledDomains])],
  });
  return imported;
}
