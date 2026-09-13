import { firstElement, readEditable, writeEditable, type ProviderAdapter } from './base';

/** Adapter placeholder. It is intentionally not enabled in the manifest until its selectors are validated. */
export class GeminiAdapter implements ProviderAdapter {
  readonly id = 'gemini' as const;

  matches(location: Location): boolean {
    return location.hostname === 'gemini.google.com';
  }

  findComposer(root: ParentNode = document): HTMLElement | null {
    return firstElement(root, ['rich-textarea [contenteditable="true"]']);
  }

  readPrompt = readEditable;
  writePrompt = writeEditable;

  isSubmitElement(target: Element): boolean {
    return Boolean(target.closest('button[aria-label*="Send"]'));
  }

  submit(root: ParentNode = document): boolean {
    const button = firstElement(root, ['button[aria-label*="Send"]']);
    if (!button) return false;
    button.click();
    return true;
  }
}
