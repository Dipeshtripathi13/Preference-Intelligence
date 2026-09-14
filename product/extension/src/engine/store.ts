import {
  DEFAULT_SETTINGS,
  type PreferenceRecord,
  type ProductSettings,
  type UsageLog,
} from './types';

export interface PreferenceStore {
  listPreferences(): Promise<PreferenceRecord[]>;
  getPreference(id: string): Promise<PreferenceRecord | undefined>;
  putPreference(preference: PreferenceRecord): Promise<void>;
  deletePreference(id: string): Promise<void>;
  clearPreferences(): Promise<void>;
  getSettings(): Promise<ProductSettings>;
  putSettings(settings: ProductSettings): Promise<void>;
  addUsageLog(log: UsageLog): Promise<void>;
  listUsageLogs(limit?: number): Promise<UsageLog[]>;
  clearUsageLogs(): Promise<void>;
}

export class MemoryPreferenceStore implements PreferenceStore {
  private preferences = new Map<string, PreferenceRecord>();
  private settings: ProductSettings = { ...DEFAULT_SETTINGS };
  private logs: UsageLog[] = [];

  async listPreferences(): Promise<PreferenceRecord[]> {
    return [...this.preferences.values()].map((item) => structuredClone(item));
  }

  async getPreference(id: string): Promise<PreferenceRecord | undefined> {
    const item = this.preferences.get(id);
    return item ? structuredClone(item) : undefined;
  }

  async putPreference(preference: PreferenceRecord): Promise<void> {
    this.preferences.set(preference.id, structuredClone(preference));
  }

  async deletePreference(id: string): Promise<void> {
    this.preferences.delete(id);
  }

  async clearPreferences(): Promise<void> {
    this.preferences.clear();
  }

  async getSettings(): Promise<ProductSettings> {
    return structuredClone(this.settings);
  }

  async putSettings(settings: ProductSettings): Promise<void> {
    this.settings = structuredClone(settings);
  }

  async addUsageLog(log: UsageLog): Promise<void> {
    this.logs = [...this.logs, structuredClone(log)].slice(-100);
  }

  async listUsageLogs(limit = 25): Promise<UsageLog[]> {
    return this.logs.slice(-limit).reverse().map((item) => structuredClone(item));
  }

  async clearUsageLogs(): Promise<void> {
    this.logs = [];
  }
}
