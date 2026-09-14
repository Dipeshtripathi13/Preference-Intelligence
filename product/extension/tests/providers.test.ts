import { describe, expect, it, vi } from 'vitest';
import { ChatGptAdapter } from '../src/providers/chatgpt';
import { ClaudeAdapter } from '../src/providers/claude';
import { adapterFor } from '../src/providers';

describe('provider adapters', () => {
  it('reads, writes, and submits ChatGPT through adapter selectors', () => {
    document.body.innerHTML = '<textarea id="prompt-textarea">Hello</textarea><button data-testid="send-button">Send</button>';
    const adapter = new ChatGptAdapter();
    const composer = adapter.findComposer()!;
    const click = vi.fn();
    document.querySelector('button')!.addEventListener('click', click);
    expect(adapter.matches({ hostname: 'chatgpt.com' } as Location)).toBe(true);
    expect(adapter.readPrompt(composer)).toBe('Hello');
    adapter.writePrompt(composer, 'Personalized');
    expect(adapter.readPrompt(composer)).toBe('Personalized');
    expect(adapter.submit()).toBe(true);
    expect(click).toHaveBeenCalledOnce();
  });

  it('targets Claude without matching unrelated origins', () => {
    document.body.innerHTML = '<div class="ProseMirror" contenteditable="true">Explain this</div><button aria-label="Send Message">Send</button>';
    const adapter = new ClaudeAdapter();
    expect(adapter.matches({ hostname: 'claude.ai' } as Location)).toBe(true);
    expect(adapter.matches({ hostname: 'example.com' } as Location)).toBe(false);
    expect(adapter.readPrompt(adapter.findComposer()!)).toBe('Explain this');
    expect(adapter.isSubmitElement(document.querySelector('button')!)).toBe(true);
  });

  it('recognizes clicks on children inside the provider send control', () => {
    document.body.innerHTML = '<button aria-label="Send message"><svg><path id="icon" /></svg></button>';
    expect(new ChatGptAdapter().isSubmitElement(document.querySelector('#icon')!)).toBe(true);
  });

  it('fails closed when a provider composer or enabled send button is unavailable', () => {
    document.body.innerHTML = '<button data-testid="send-button" disabled>Send</button>';
    const adapter = new ChatGptAdapter();
    expect(adapter.findComposer()).toBeNull();
    expect(adapter.submit()).toBe(false);
    document.body.innerHTML = '<button aria-label="Send Message" aria-disabled="true">Send</button>';
    expect(new ClaudeAdapter().submit()).toBe(false);
  });

  it('does not activate on an unsupported website', () => {
    expect(adapterFor({ hostname: 'example.com' } as Location)).toBeUndefined();
  });
});
