import {
  closestMatches,
  clickFirstEnabled,
  firstElement,
  readEditable,
  writeEditable,
  type ProviderAdapter,
} from './base';
import { PROVIDER_SELECTORS } from './selectors';

const { composers: COMPOSERS, submit: SUBMIT } = PROVIDER_SELECTORS.chatgpt;

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
    return clickFirstEnabled(root, SUBMIT);
  }
}
