import { describe, expect, it } from 'vitest';
import { processPreferenceMessage } from '../src/engine/portableEngine';

describe('portable engine API', () => {
  it('takes a message and profile and returns both an updated profile and instruction', async () => {
    const first = await processPreferenceMessage({ message: 'Always keep answers concise.' });
    expect(first.profile).toHaveLength(1);
    expect(first.profile[0]).toMatchObject({ dimension: 'verbosity', value: 'concise', scope: {} });
    expect(first.instruction).toContain('Keep the response concise.');

    const second = await processPreferenceMessage({
      message: 'Explain event loops.',
      profile: first.profile,
      trustedUserAction: true,
    });
    expect(second.profile).toHaveLength(1);
    expect(second.instruction).toContain('Keep the response concise.');
  });
});
