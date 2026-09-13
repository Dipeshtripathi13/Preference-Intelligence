export type ProviderId = 'chatgpt' | 'claude' | 'gemini';

export interface ProviderAdapter {
  readonly id: ProviderId;
  matches(location: Location): boolean;
  findComposer(root?: ParentNode): HTMLElement | null;
  readPrompt(composer: HTMLElement): string;
  writePrompt(composer: HTMLElement, prompt: string): void;
  isSubmitElement(target: Element): boolean;
  submit(root?: ParentNode): boolean;
}

export function readEditable(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return element.value.trim();
  return (element.innerText || element.textContent || '').trim();
}

export function writeEditable(element: HTMLElement, value: string): void {
  element.focus();
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    setter?.call(element, value);
  } else {
    element.textContent = value;
  }
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
}

export function closestMatches(target: Element, selectors: readonly string[]): boolean {
  return selectors.some((selector) => Boolean(target.closest(selector)));
}

export function firstElement(root: ParentNode, selectors: readonly string[]): HTMLElement | null {
  for (const selector of selectors) {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) return element;
  }
  return null;
}
