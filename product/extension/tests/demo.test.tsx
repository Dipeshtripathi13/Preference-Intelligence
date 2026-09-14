import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/demo/App';

describe('standalone preference playground', () => {
  it('demonstrates domain switching, abstention, and a learning update', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getAllByText('Locked')).toHaveLength(6));
    fireEvent.click(screen.getByRole('button', { name: 'Personalize this request →' }));

    await screen.findByText('Applied 4 relevant preferences; unrelated preferences were withheld.');
    expect(screen.getByText('Technical Depth: Advanced')).toBeDefined();
    expect(screen.getByText(/Pre-generated demonstration response/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Claude' }));
    expect(screen.getByText(/Virtual threads make blocking Java code scale/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Bond duration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Personalize this request →' }));
    await screen.findByText('Applied 5 relevant preferences; unrelated preferences were withheld.');
    expect(screen.getByText('Technical Depth: Beginner')).toBeDefined();
    expect(screen.getByText(/Stored for java \(software_engineering\); this request is fixed_income \(finance\)/)).toBeDefined();

    fireEvent.change(screen.getByRole('textbox', { name: 'Your request' }), {
      target: { value: 'For finance, use more real-world examples.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Personalize this request →' }));
    await screen.findByText(/A direct user correction changed when useful to preferred/);
    fireEvent.click(screen.getByRole('button', { name: 'Convexity abstention' }));
    fireEvent.click(screen.getByRole('button', { name: 'Personalize this request →' }));
    await screen.findByText('Example Preference: Preferred');

    fireEvent.click(screen.getByRole('button', { name: '3 · Learning loop' }));
    fireEvent.click(screen.getByRole('button', { name: /Ask the first question/ }));
    await waitFor(() => expect((screen.getByRole('button', { name: /Correct the response style/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /Correct the response style/ }));
    await screen.findByText(/A direct user correction changed intermediate to advanced/);
    await waitFor(() => expect((screen.getByRole('button', { name: /Ask a follow-up/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /Ask a follow-up/ }));
    await screen.findByText('Advanced infrastructure profile behavior');
  });
});
