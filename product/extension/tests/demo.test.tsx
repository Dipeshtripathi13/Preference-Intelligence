import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/demo/App';

describe('standalone preference playground', () => {
  it('seeds a local policy and explains a contextual compilation', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getAllByText('Locked')).toHaveLength(6));
    fireEvent.click(screen.getByRole('button', { name: 'Personalize request' }));

    await screen.findByText('Applied 4 relevant preferences.');
    expect(screen.getByText('Technical Depth → Beginner')).toBeDefined();
    expect(screen.getByText('Example Preference → Preferred')).toBeDefined();
    expect(screen.getByText(/<preference-intelligence>/).textContent).toContain(
      'Use beginner-level technical depth.',
    );
  });
});
