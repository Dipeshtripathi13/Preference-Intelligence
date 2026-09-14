import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/demo/App';

describe('standalone preference playground', () => {
  it('demonstrates global setup preferences, request overrides, and a learning update', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('5 local records')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Personalize this request →' }));

    await screen.findByText('Applied 5 relevant preferences; unrelated preferences were withheld.');
    expect(screen.getByText('Technical Depth: Intermediate')).toBeDefined();
    expect(screen.getByText('Global only')).toBeDefined();
    expect(screen.getByText(/Pre-generated demonstration response/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Claude' }));
    expect(screen.getByText(/Virtual threads make blocking Java code scale/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Detailed current override' }));
    fireEvent.click(screen.getByRole('button', { name: 'Personalize this request →' }));
    await screen.findByText('Applied 4 relevant preferences; unrelated preferences were withheld.');
    expect(screen.getByText(/current request explicitly asks for detailed/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '3 · Learning loop' }));
    fireEvent.click(screen.getByRole('button', { name: /Ask the first question/ }));
    await waitFor(() => expect((screen.getByRole('button', { name: /Correct the response style/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /Correct the response style/ }));
    await screen.findByText(/newer direct preference statement superseded intermediate/i);
    await waitFor(() => expect((screen.getByRole('button', { name: /Ask a follow-up/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /Ask a follow-up/ }));
    await screen.findByText('Advanced infrastructure profile behavior');
  });
});
