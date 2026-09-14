import { describe, expect, it } from 'vitest';
import { showPreferenceIndicator } from '../src/content/indicator';
import { ContextCompiler } from '../src/engine/contextCompiler';
import { preference, ranked } from './helpers';

describe('in-page preference indicator', () => {
  it('stays compact until clicked and exposes applied decisions', () => {
    const record = preference('verbosity', 'concise');
    const compiled = new ContextCompiler().compile(
      'Explain this.',
      { domain: 'general', task: 'explanation', confidence: 0.35 },
      [ranked(record)],
    );
    const host = showPreferenceIndicator(compiled);
    const button = host.shadowRoot!.querySelector('button')!;
    expect(button.textContent).toContain('Using 1');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(host.shadowRoot!.textContent).toContain('Verbosity: Concise');
  });
});
