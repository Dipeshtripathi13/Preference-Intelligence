import {
  closestMatches,
  firstElement,
  readEditable,
  writeEditable,
  type ProviderAdapter,
} from './base';

const COMPOSERS = ['div[contenteditable="true"].ProseMirror', '[data-testid="chat-input"] [contenteditable="true"]', 'fieldset div[contenteditable="true"]'];
const SUBMIT = ['button[aria-label="Send Message"]', 'button[aria-label="Send message"]', 'button[data-testid="send-button"]'];

export class ClaudeAdapter implements ProviderAdapter {
  readonly id = 'claude' as const;

  matches(location: Location): boolean {
    return location.hostname === 'claude.ai';
  }

  findComposer(root: ParentNode = document): HTMLElement | null {
    return firstElement(root, COMPOSERS);
  }

  readPrompt = readEditable;
  writePrompt = writeEditable;

  isSubmitElement(target: Element): boolean {
    return closestMatches(target, SUBMIT);
  }

  submit(root: ParentNode = document): boolean {
    const button = firstElement(root, SUBMIT);
    if (!button) return false;
    button.click();
    return true;
  }
}
