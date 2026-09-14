import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Onboarding } from '../src/dashboard/Onboarding';
import { createOnboardingRecord, parseExistingInstructions } from '../src/engine/onboarding';

describe('global-first onboarding', () => {
  it('parses bounded preferences without retaining pasted instructions', () => {
    const parsed = parseExistingInstructions('Keep answers concise. Use bullets and put the answer first.');
    expect(parsed).toEqual(expect.arrayContaining([
      expect.objectContaining({ dimension: 'verbosity', value: 'concise', evidenceKind: 'onboarding_import' }),
      expect.objectContaining({ dimension: 'format_preference', value: 'bullets' }),
      expect.objectContaining({ dimension: 'answer_first_preference', value: 'answer_first' }),
    ]));
    expect(parsed.every((item) => !('text' in item))).toBe(true);
  });

  it('creates an immediately active but weak setup record', () => {
    let id = 0;
    const record = createOnboardingRecord(
      { dimension: 'verbosity', value: 'concise', signal: 'onboarding_chose_concise', evidenceKind: 'onboarding_choice' },
      '2026-09-14T12:00:00.000Z',
      () => `id-${id += 1}`,
    );
    expect(record).toMatchObject({
      scope: {}, confidence: 0.5, sourceType: 'onboarding_declaration', state: 'inferred', locked: false,
    });
    expect(record.provenance[0]).toMatchObject({ origin: 'onboarding', evidenceKind: 'onboarding_choice' });
  });

  it('keeps setup skippable from the first screen', async () => {
    const complete = vi.fn().mockResolvedValue(undefined);
    render(<Onboarding onComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip setup' }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith([], []));
  });

  it('returns paired choices, use areas, and locally parsed instructions', async () => {
    const complete = vi.fn().mockResolvedValue(undefined);
    render(<Onboarding onComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compare answers' }));
    fireEvent.click(screen.getByRole('button', { name: /^Short answer/ }));
    for (let step = 0; step < 4; step += 1) fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Code' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Use bullets and put the answer first.' } });
    fireEvent.click(screen.getByRole('button', { name: /Finish with 3 preferences/ }));

    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    const [preferences, areas] = complete.mock.calls[0];
    expect(preferences).toEqual(expect.arrayContaining([
      expect.objectContaining({ dimension: 'verbosity', value: 'concise' }),
      expect.objectContaining({ dimension: 'format_preference', value: 'bullets' }),
      expect.objectContaining({ dimension: 'answer_first_preference', value: 'answer_first' }),
    ]));
    expect(areas).toEqual(['code']);
  });
});
