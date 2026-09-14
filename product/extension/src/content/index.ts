import type { ClassifiedContext } from '../engine/types';
import type { ExtensionResponse } from '../messaging';
import { sendExtensionMessage } from '../messaging';
import { adapterFor } from '../providers';
import { composePersonalizedPrompt } from './promptComposer';
import {
  removePreferenceDraftIndicator,
  showPreferenceDraftIndicator,
  showPreferenceIndicator,
} from './indicator';

const adapter = adapterFor(window.location);
let processing = false;
let contextHint: ClassifiedContext | undefined;
let trustedSnapshot: { element: HTMLElement; text: string } | undefined;
let preparedDraft: { element: HTMLElement; originalPrompt: string; compiled: Extract<ExtensionResponse, { ok: true; compiled: unknown }>['compiled'] } | undefined;

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

  // A second deliberate submit sends the visible, user-editable draft through
  // the provider's normal event path. It must not be learned or rewritten twice.
  if (preparedDraft?.element === composer) {
    const completed = preparedDraft;
    preparedDraft = undefined;
    removePreferenceDraftIndicator();
    showPreferenceIndicator(completed.compiled);
    return;
  }
  if (preparedDraft) {
    preparedDraft = undefined;
    removePreferenceDraftIndicator();
  }
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
    if (response.compiled.instruction) {
      const visibleDraft = composePersonalizedPrompt(prompt, response.compiled.instruction);
      adapter.writePrompt(composer, visibleDraft);
      trustedSnapshot = { element: composer, text: visibleDraft };
      preparedDraft = { element: composer, originalPrompt: prompt, compiled: response.compiled };
      showPreferenceDraftIndicator(response.compiled, () => {
        if (preparedDraft?.element !== composer) return;
        const originalPrompt = preparedDraft.originalPrompt;
        preparedDraft = undefined;
        adapter.writePrompt(composer, originalPrompt);
        trustedSnapshot = { element: composer, text: originalPrompt };
        removePreferenceDraftIndicator();
      });
      return;
    }
    adapter.submit();
  } catch {
    // Fail closed and silent: restore the exact user-authored text, show no UI,
    // and let the provider submit normally if its control is still available.
    preparedDraft = undefined;
    removePreferenceDraftIndicator();
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
    if (event.key === 'Escape' && preparedDraft) {
      const composer = adapter.findComposer();
      if (composer && composer === preparedDraft.element
        && event.target instanceof Node && (composer === event.target || composer.contains(event.target))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const originalPrompt = preparedDraft.originalPrompt;
        preparedDraft = undefined;
        adapter.writePrompt(composer, originalPrompt);
        trustedSnapshot = { element: composer, text: originalPrompt };
        removePreferenceDraftIndicator();
      }
      return;
    }
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    const composer = adapter.findComposer();
    if (composer && event.target instanceof Node && (composer === event.target || composer.contains(event.target))) {
      void personalizeAndSubmit(event);
    }
  }, true);
}
