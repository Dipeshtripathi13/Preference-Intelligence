import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
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

interface PreferenceDatabase extends DBSchema {
  preferences: {
    key: string;
    value: PreferenceRecord;
    indexes: { 'by-dimension': string; 'by-last-observed': string };
  };
  settings: { key: string; value: ProductSettings };
  usageLogs: {
    key: string;
    value: UsageLog;
    indexes: { 'by-timestamp': string };
  };
}

export class IndexedDbPreferenceStore implements PreferenceStore {
  private database?: Promise<IDBPDatabase<PreferenceDatabase>>;

  constructor(private readonly databaseName = 'preference-intelligence') {}

  private db(): Promise<IDBPDatabase<PreferenceDatabase>> {
    if (!this.database) {
      this.database = openDB<PreferenceDatabase>(this.databaseName, 1, {
        upgrade(database) {
          const preferences = database.createObjectStore('preferences', { keyPath: 'id' });
          preferences.createIndex('by-dimension', 'dimension');
          preferences.createIndex('by-last-observed', 'lastObservedAt');
          database.createObjectStore('settings');
          const usageLogs = database.createObjectStore('usageLogs', { keyPath: 'id' });
          usageLogs.createIndex('by-timestamp', 'timestamp');
        },
      });
    }
    return this.database;
  }

  async listPreferences(): Promise<PreferenceRecord[]> {
    return (await this.db()).getAll('preferences');
  }

  async getPreference(id: string): Promise<PreferenceRecord | undefined> {
    return (await this.db()).get('preferences', id);
  }

  async putPreference(preference: PreferenceRecord): Promise<void> {
    await (await this.db()).put('preferences', preference);
  }

  async deletePreference(id: string): Promise<void> {
    await (await this.db()).delete('preferences', id);
  }

  async clearPreferences(): Promise<void> {
    await (await this.db()).clear('preferences');
  }

  async getSettings(): Promise<ProductSettings> {
    return { ...DEFAULT_SETTINGS, ...((await (await this.db()).get('settings', 'main')) ?? {}) };
  }

  async putSettings(settings: ProductSettings): Promise<void> {
    await (await this.db()).put('settings', settings, 'main');
  }

  async addUsageLog(log: UsageLog): Promise<void> {
    const database = await this.db();
    await database.put('usageLogs', log);
    const keys = await database.getAllKeysFromIndex('usageLogs', 'by-timestamp');
    if (keys.length > 100) {
      const transaction = database.transaction('usageLogs', 'readwrite');
      await Promise.all(keys.slice(0, keys.length - 100).map((key) => transaction.store.delete(key)));
      await transaction.done;
    }
  }

  async listUsageLogs(limit = 25): Promise<UsageLog[]> {
    const logs = await (await this.db()).getAllFromIndex('usageLogs', 'by-timestamp');
    return logs.reverse().slice(0, limit);
  }

  async clearUsageLogs(): Promise<void> {
    await (await this.db()).clear('usageLogs');
  }
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
