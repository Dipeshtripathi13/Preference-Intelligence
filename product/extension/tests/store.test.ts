import { describe, expect, it } from 'vitest';
import { IndexedDbPreferenceStore } from '../src/engine/store';
import { preference } from './helpers';

describe('IndexedDbPreferenceStore', () => {
  it('persists, retrieves, and deletes a preference', async () => {
    const name = `preference-test-${Date.now()}-${Math.random()}`;
    const first = new IndexedDbPreferenceStore(name);
    const record = preference('tone', 'professional');
    await first.putPreference(record);
    const second = new IndexedDbPreferenceStore(name);
    expect(await second.getPreference(record.id)).toEqual(record);
    await second.deletePreference(record.id);
    expect(await second.getPreference(record.id)).toBeUndefined();
  });
});
