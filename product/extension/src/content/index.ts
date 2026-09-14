import type { ClassifiedContext } from '../engine/types';
import type { ExtensionResponse } from '../messaging';
import { sendExtensionMessage } from '../messaging';
import { adapterFor } from '../providers';
import { composePersonalizedPrompt } from './promptComposer';
import { showPreferenceIndicator } from './indicator';

const adapter = adapterFor(window.location);
let processing = false;
let contextHint: ClassifiedContext | undefined;
let trustedSnapshot: { element: HTMLElement; text: string } | undefined;

function rememberTrustedInput(event: Event): void {
  if (!adapter || !event.isTrusted) return;
  const composer = adapter.findComposer();
  if (!composer || !(event.target instanceof Node) || !composer.contains(event.target) && event.target !== composer) return;
  queueMicrotask(() => {
    trustedSnapshot = { element: composer, text: adapter.readPrompt(composer) };
  });
}

async function personalizeAndSubmit(event: Event): Promise<void> {
  if (!adapter || processing || !event.isTrusted) return;
  const composer = adapter.findComposer();
  if (!composer) return;
  const prompt = adapter.readPrompt(composer);
  if (!prompt) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  processing = true;
  const trustedUserAction = trustedSnapshot?.element === composer && trustedSnapshot.text === prompt;

  try {
    const response = await sendExtensionMessage<ExtensionResponse>({
      type: 'COMPILE_PROMPT',
      prompt,
      provider: adapter.id,
      trustedUserAction,
      contextHint,
    });
    if (!response.ok) throw new Error(response.error);
    if (!('compiled' in response)) throw new Error('Invalid compile response.');
    contextHint = response.compiled.classification;
    showPreferenceIndicator(response.compiled, document, async (preferenceId) => {
      const update = await sendExtensionMessage<ExtensionResponse>({
        type: 'MARK_NOT_APPLICABLE',
        preferenceId,
        context: response.compiled.classification,
      });
      if (!update.ok) throw new Error(update.error);
    });
    if (response.compiled.instruction) {
      adapter.writePrompt(composer, composePersonalizedPrompt(prompt, response.compiled.instruction));
    }
    if (!adapter.submit()) throw new Error('The provider send button was not found.');
  } catch (error) {
    console.warn('[Preference Intelligence] Sending without personalization:', error);
    adapter.writePrompt(composer, prompt);
    adapter.submit();
  } finally {
    processing = false;
  }
}

if (adapter) {
  document.addEventListener('input', rememberTrustedInput, true);
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && adapter.isSubmitElement(event.target)) void personalizeAndSubmit(event);
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    const composer = adapter.findComposer();
    if (composer && event.target instanceof Node && (composer === event.target || composer.contains(event.target))) {
      void personalizeAndSubmit(event);
    }
  }, true);
}
