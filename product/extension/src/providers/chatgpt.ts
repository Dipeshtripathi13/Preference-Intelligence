import {
  closestMatches,
  firstElement,
  readEditable,
  writeEditable,
  type ProviderAdapter,
} from './base';

const COMPOSERS = ['#prompt-textarea', 'textarea[data-testid="prompt-textarea"]', 'div.ProseMirror[contenteditable="true"]'];
const SUBMIT = ['button[data-testid="send-button"]', 'button[aria-label="Send prompt"]', 'button[aria-label="Send message"]'];

export class ChatGptAdapter implements ProviderAdapter {
  readonly id = 'chatgpt' as const;

  matches(location: Location): boolean {
    return location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com';
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
