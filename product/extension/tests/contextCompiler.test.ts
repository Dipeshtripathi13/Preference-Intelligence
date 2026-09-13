import { describe, expect, it } from 'vitest';
import { ContextCompiler } from '../src/engine/contextCompiler';
import { composePersonalizedPrompt } from '../src/content/promptComposer';
import { preference } from './helpers';

const context = { domain: 'general' as const, task: 'explanation' as const, confidence: 0.5 };

describe('ContextCompiler', () => {
  it('suppresses a stored preference when the current prompt conflicts', () => {
    const concise = preference('verbosity', 'concise');
    const result = new ContextCompiler().compile(
      'Give me a comprehensive 3,000-word explanation.',
      context,
      [{ preference: concise, score: 9, reason: 'Global fallback' }],
    );
    expect(result.instruction).toBe('');
    expect(result.decisions[0]).toMatchObject({ status: 'overridden_by_current_prompt' });
  });

  it('renders only fixed templates and returns why-used metadata', () => {
    const concise = preference('verbosity', 'concise');
    const result = new ContextCompiler().compile('What is this?', context, [{ preference: concise, score: 9, reason: 'Global fallback' }]);
    expect(result.instruction).toContain('Keep the response concise.');
    expect(result.decisions[0]).toMatchObject({ preferenceId: concise.id, status: 'used' });
  });

  it('puts compiled defaults first and the untouched request last', () => {
    const request = 'Give me a comprehensive answer with this exact ending.';
    const composed = composePersonalizedPrompt(request, '<preference-intelligence>Be concise.</preference-intelligence>');
    expect(composed.indexOf('<preference-intelligence>')).toBeLessThan(composed.indexOf(request));
    expect(composed.endsWith(request)).toBe(true);
  });
});
