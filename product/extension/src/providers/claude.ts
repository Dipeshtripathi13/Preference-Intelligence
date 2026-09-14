import {
  closestMatches,
  clickFirstEnabled,
  firstElement,
  readEditable,
  writeEditable,
  type ProviderAdapter,
} from './base';
import { PROVIDER_SELECTORS } from './selectors';

const { composers: COMPOSERS, submit: SUBMIT } = PROVIDER_SELECTORS.claude;

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
    return clickFirstEnabled(root, SUBMIT);
  }
}
