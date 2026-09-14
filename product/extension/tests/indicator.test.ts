import { describe, expect, it, vi } from 'vitest';
import { showPreferenceDraftIndicator, showPreferenceIndicator } from '../src/content/indicator';
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

  it('makes a prepared injection review and one-action removal explicit', () => {
    const record = preference('verbosity', 'concise');
    const compiled = new ContextCompiler().compile(
      'Explain this.',
      { domain: 'general', task: 'explanation', confidence: 0.35 },
      [ranked(record)],
    );
    const dismiss = vi.fn();
    const host = showPreferenceDraftIndicator(compiled, dismiss);
    expect(host.shadowRoot!.textContent).toContain('added for review');
    expect(host.shadowRoot!.textContent).toContain('Esc');
    (host.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    expect(dismiss).toHaveBeenCalledOnce();
  });
});
