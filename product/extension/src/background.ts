import { PreferenceEngine } from './engine/engine';
import { createOnboardingRecord } from './engine/onboarding';
import { exportProfile, importProfile } from './engine/profile';
import { IndexedDbPreferenceStore } from './storage/indexedDbPreferenceStore';
import {
  DIMENSIONS,
  isAllowedValue,
  PRIMARY_USE_AREAS,
  type PreferenceRecord,
  type PreferenceSource,
  type PreferenceState,
} from './engine/types';
import type { ExtensionRequest, ExtensionResponse } from './messaging';

const store = new IndexedDbPreferenceStore();
const engine = new PreferenceEngine(store);
const PROVIDER_HOSTS = new Set(['chatgpt.com', 'chat.openai.com', 'claude.ai']);

function identifier(): string {
  return globalThis.crypto?.randomUUID?.() ?? `pref-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function providerSender(sender: chrome.runtime.MessageSender): boolean {
  if (sender.tab?.id === undefined || !sender.url) return false;
  try {
    return PROVIDER_HOSTS.has(new URL(sender.url).hostname);
  } catch {
    return false;
  }
}

function extensionSender(sender: chrome.runtime.MessageSender): boolean {
  return sender.id === chrome.runtime.id && Boolean(sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`));
}

function assertDashboardSender(sender: chrome.runtime.MessageSender): void {
  if (!extensionSender(sender)) throw new Error('This operation is only available from the extension dashboard.');
}

async function savePreference(input: Extract<ExtensionRequest, { type: 'SAVE_PREFERENCE' }>['preference']): Promise<PreferenceRecord> {
  if (!DIMENSIONS.includes(input.dimension) || !isAllowedValue(input.dimension, input.value)) {
    throw new Error('Unsupported preference dimension or value.');
  }
  const now = new Date().toISOString();
  const existing = input.id ? await store.getPreference(input.id) : undefined;
  const sourceType: PreferenceSource = 'user_edit';
  const state: PreferenceState = input.locked ? 'locked' : 'confirmed';
  const record: PreferenceRecord = {
    id: existing?.id ?? identifier(),
    dimension: input.dimension,
    value: input.value,
    scope: input.scope,
    confidence: 1,
    evidenceCount: (existing?.evidenceCount ?? 0) + 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastObservedAt: now,
    sourceType,
    state,
    locked: input.locked,
    enabled: input.enabled,
    decayRate: 0,
    lifetime: input.locked ? 'locked' : 'durable',
    notApplicableTo: input.notApplicableTo ?? existing?.notApplicableTo,
    provenance: [
      ...(existing?.provenance ?? []),
      { id: identifier(), sourceType, origin: 'dashboard' as const, observedAt: now, signal: existing ? 'dashboard_edit' : 'dashboard_create', evidenceKind: 'dashboard_edit' as const, strength: 1 },
    ].slice(-50),
  };
  await store.putPreference(record);
  return record;
}

async function completeOnboarding(
  request: Extract<ExtensionRequest, { type: 'COMPLETE_ONBOARDING' }>,
): Promise<number> {
  if (request.preferences.length > DIMENSIONS.length
    || request.primaryUseAreas.some((area) => !PRIMARY_USE_AREAS.includes(area))) {
    throw new Error('Invalid onboarding selection.');
  }

  const dimensions = new Set<string>();
  for (const selection of request.preferences) {
    if (dimensions.has(selection.dimension)
      || !DIMENSIONS.includes(selection.dimension)
      || !isAllowedValue(selection.dimension, selection.value)
      || !['onboarding_choice', 'onboarding_import'].includes(selection.evidenceKind)
      || !/^[a-z0-9_]{1,120}$/.test(selection.signal)) {
      throw new Error('Invalid onboarding preference.');
    }
    dimensions.add(selection.dimension);
  }

  const existingRecords = await store.listPreferences();
  let onboarded = 0;
  for (const selection of request.preferences) {
    // Setup must never weaken or replace an existing earned/user-owned value.
    const existing = existingRecords.find((record) => record.dimension === selection.dimension
      && !record.scope.domain && !record.scope.subdomain && !record.scope.task);
    if (existing) continue;

    const record = createOnboardingRecord(selection, new Date().toISOString(), identifier);
    await store.putPreference(record);
    onboarded += 1;
  }

  const settings = await store.getSettings();
  await store.putSettings({
    ...settings,
    onboardingCompleted: true,
    primaryUseAreas: [...new Set(request.primaryUseAreas)],
  });
  return onboarded;
}

async function handleMessage(request: ExtensionRequest, sender: chrome.runtime.MessageSender): Promise<ExtensionResponse> {
  switch (request.type) {
    case 'COMPILE_PROMPT': {
      if (!providerSender(sender)) throw new Error('Rejected prompt from an untrusted sender.');
      if (typeof request.prompt !== 'string' || request.prompt.length > 100_000) throw new Error('Invalid prompt.');
      const compiled = await engine.processPrompt({
        prompt: request.prompt,
        provider: request.provider,
        trustedUserAction: request.trustedUserAction === true,
        contextHint: request.contextHint,
      });
      return { ok: true, compiled };
    }
    case 'GET_DASHBOARD_STATE':
      assertDashboardSender(sender);
      return {
        ok: true,
        state: {
          preferences: await store.listPreferences(),
          settings: await store.getSettings(),
          usageLogs: await store.listUsageLogs(),
        },
      };
    case 'COMPLETE_ONBOARDING':
      assertDashboardSender(sender);
      return { ok: true, onboarded: await completeOnboarding(request) };
    case 'SAVE_PREFERENCE':
      assertDashboardSender(sender);
      return { ok: true, preference: await savePreference(request.preference) };
    case 'DELETE_PREFERENCE':
      assertDashboardSender(sender);
      await store.deletePreference(request.id);
      return { ok: true };
    case 'MARK_NOT_APPLICABLE': {
      if (!providerSender(sender)) throw new Error('Rejected applicability correction from an untrusted sender.');
      const record = await store.getPreference(request.preferenceId);
      if (!record) throw new Error('Preference not found.');
      const correction = {
        domain: request.context.domain,
        subdomain: request.context.subdomain,
        task: request.context.task,
      };
      await store.putPreference({
        ...record,
        updatedAt: new Date().toISOString(),
        notApplicableTo: [...(record.notApplicableTo ?? []), correction].slice(-25),
        provenance: [...record.provenance, {
          id: identifier(),
          sourceType: 'implicit_feedback' as const,
          origin: 'user_composer' as const,
          observedAt: new Date().toISOString(),
          signal: 'not_applicable_for_context',
          evidenceKind: 'direct_correction' as const,
          strength: 1,
          polarity: 'negative' as const,
          scope: correction,
        }].slice(-50),
      });
      return { ok: true };
    }
    case 'RESET_PROFILE':
      assertDashboardSender(sender);
      await store.clearPreferences();
      await store.clearUsageLogs();
      return { ok: true };
    case 'UPDATE_SETTINGS': {
      assertDashboardSender(sender);
      const current = await store.getSettings();
      await store.putSettings({ ...current, ...request.settings });
      return { ok: true };
    }
    case 'EXPORT_PROFILE':
      assertDashboardSender(sender);
      return { ok: true, profile: await exportProfile(store) };
    case 'IMPORT_PROFILE':
      assertDashboardSender(sender);
      return { ok: true, imported: await importProfile(store, request.profile, request.replace) };
    case 'CLEAR_USAGE_LOGS':
      assertDashboardSender(sender);
      await store.clearUsageLogs();
      return { ok: true };
    case 'OPEN_DASHBOARD':
      assertDashboardSender(sender);
      await chrome.runtime.openOptionsPage();
      return { ok: true };
    default:
      throw new Error('Unknown extension request.');
  }
}

chrome.runtime.onMessage.addListener((request: ExtensionRequest, sender, sendResponse) => {
  void handleMessage(request, sender)
    .then(sendResponse)
    .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }));
  return true;
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') void chrome.runtime.openOptionsPage();
});
