import type {
  ClassifiedContext,
  CompiledContext,
  PreferenceDimension,
  PreferenceRecord,
  ProductSettings,
  Scope,
  UsageLog,
} from './engine/types';
import type { CanonicalProfile } from './engine/profile';

export interface DashboardState {
  preferences: PreferenceRecord[];
  settings: ProductSettings;
  usageLogs: UsageLog[];
}

export type ExtensionRequest =
  | { type: 'COMPILE_PROMPT'; prompt: string; provider: string; trustedUserAction: boolean; contextHint?: ClassifiedContext }
  | { type: 'GET_DASHBOARD_STATE' }
  | { type: 'SAVE_PREFERENCE'; preference: { id?: string; dimension: PreferenceDimension; value: string; scope: Scope; locked: boolean; enabled: boolean; notApplicableTo?: Scope[] } }
  | { type: 'MARK_NOT_APPLICABLE'; preferenceId: string; context: ClassifiedContext }
  | { type: 'DELETE_PREFERENCE'; id: string }
  | { type: 'RESET_PROFILE' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<ProductSettings> }
  | { type: 'EXPORT_PROFILE' }
  | { type: 'IMPORT_PROFILE'; profile: unknown; replace: boolean }
  | { type: 'CLEAR_USAGE_LOGS' }
  | { type: 'OPEN_DASHBOARD' };

export type ExtensionResponse =
  | { ok: true; compiled: CompiledContext }
  | { ok: true; state: DashboardState }
  | { ok: true; preference: PreferenceRecord }
  | { ok: true; profile: CanonicalProfile }
  | { ok: true; imported: number }
  | { ok: true }
  | { ok: false; error: string };

export function sendExtensionMessage<T extends ExtensionResponse>(request: ExtensionRequest): Promise<T> {
  return chrome.runtime.sendMessage(request) as Promise<T>;
}
