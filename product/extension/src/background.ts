import { PreferenceEngine } from './engine/engine';
import { exportProfile, importProfile } from './engine/profile';
import { IndexedDbPreferenceStore } from './engine/store';
import {
  DIMENSIONS,
  isAllowedValue,
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
    provenance: [
      ...(existing?.provenance ?? []),
      { id: identifier(), sourceType, origin: 'dashboard' as const, observedAt: now, signal: existing ? 'dashboard_edit' : 'dashboard_create' },
    ].slice(-50),
  };
  await store.putPreference(record);
  return record;
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
    case 'SAVE_PREFERENCE':
      assertDashboardSender(sender);
      return { ok: true, preference: await savePreference(request.preference) };
    case 'DELETE_PREFERENCE':
      assertDashboardSender(sender);
      await store.deletePreference(request.id);
      return { ok: true };
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
